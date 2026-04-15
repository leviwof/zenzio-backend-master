
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as firebaseAdmin from 'firebase-admin';
import axios, { AxiosResponse } from 'axios';
import admin from './firebase-admin';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { JwtPayload, JwtServiceShared } from 'src/shared/jwt.service';
import { UtilService } from 'src/utils/util.service';
import { VerificationFlags } from 'src/constants/app.enums';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { Roles } from 'src/constants/app.constants';
import { Fleet } from 'src/fleet-v2/entity/fleet.entity';
import { MailService } from 'src/mail/mail.service';

interface FirebaseLoginResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface FirebaseRefreshResponse {
  id_token: string;
  refresh_token: string;
  expires_in: string;
}

interface FirebaseError {
  code?: string;
  message?: string;
  stack?: string;
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
}

interface DecodedGoogleToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: any;
}

@Injectable()
export class FirebaseService {
  async verifyGoogleIdToken(
    idToken: string,
  ): Promise<DecodedGoogleToken | PromiseLike<DecodedGoogleToken>> {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: typeof decoded.name === 'string' ? decoded.name : undefined,
      picture: decoded.picture,
    };
  }
  private readonly apiKey: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Fleet)
    private readonly fleetRepository: Repository<Fleet>,
    private readonly utilService: UtilService,
    private readonly jwtService: JwtServiceShared,
    private readonly mailService: MailService,
  ) {
    const key = process.env.FIREBASE_API_KEY;
    console.log('firebasekey', { key });
    if (!key) {
      throw new Error('Firebase API key is not defined in environment variables');
    }
    this.apiKey = key;
  }

  
  async registerUser(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phoneNumber?: string,
  ): Promise<firebaseAdmin.auth.UserRecord> {
    try {
      
      const userRecord: firebaseAdmin.auth.UserRecord = await firebaseAdmin.auth().createUser({
        displayName: `${firstName} ${lastName}`,
        email,
        password,
        phoneNumber,
      });
      return userRecord;
    } catch (error: any) {
      
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️ Firebase account already exists for ${email}, reusing existing UID.`);
        const existingUser = await firebaseAdmin.auth().getUserByEmail(email);
        return existingUser;
      }

      
      if (error.code === 'auth/invalid-password') {
        throw new BadRequestException('Password must be at least 6 characters.');
      }

      throw new BadRequestException('Failed to register Firebase user.');
    }
  }

  async loginUser(email: string, password: string, userType = '4'): Promise<any> {
    
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`;

    try {
      const response = await this.sendPostRequest<FirebaseLoginResponse>(url, {
        email,
        password,
        returnSecureToken: true,
      });

      if (!response?.idToken) {
        throw new Error('Invalid Firebase response');
      }

      
      const fireBaseUser = await admin.auth().verifyIdToken(response.idToken);
      const firebase_uid = fireBaseUser.uid;
      const firebase_email = fireBaseUser.email;
      const email_verified = fireBaseUser.email_verified;
      
      let user: any = null;

      if (userType === Roles.USER_FLEET) {
        user = await this.fleetRepository.findOne({ where: { firebase_uid } });
      } else if (userType === Roles.USER_RESTAURANT) {
        user = await this.restaurantRepository.findOne({ where: { firebase_uid } });
      } else {
        user = await this.userRepository.findOne({ where: { firebase_uid } });
      }

      // --- AUTO-REPAIR LOGIC: If UID mismatch but email exists in contact table ---
      if (!user && firebase_email) {
        console.log(`🔍 [AuthRepair] UID mismatch for ${firebase_email}. Searching by contact email...`);
        if (userType === Roles.USER_RESTAURANT) {
          user = await this.restaurantRepository.createQueryBuilder('restaurant')
            .leftJoinAndSelect('restaurant.contact', 'contact')
            .where('contact.encryptedEmail = :email', { email: firebase_email })
            .getOne();
        } else if (userType === Roles.USER_FLEET) {
          user = await this.fleetRepository.createQueryBuilder('fleet')
            .leftJoinAndSelect('fleet.contact', 'contact')
            .where('contact.encryptedEmail = :email OR contact.contactEmail = :email', { email: firebase_email })
            .getOne();
        } else {
          user = await this.userRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.contact', 'contact')
            .where('contact.encryptedEmail = :email', { email: firebase_email })
            .getOne();
        }

        if (user) {
          console.log(`🔧 [AuthRepair] Found orphan account. Updating firebase_uid to ${firebase_uid}`);
          user.firebase_uid = firebase_uid;
          if (userType === Roles.USER_FLEET) {
            await this.fleetRepository.save(user);
          } else if (userType === Roles.USER_RESTAURANT) {
            await this.restaurantRepository.save(user);
          } else {
            await this.userRepository.save(user);
          }
        }
      }

      if (!user) {
        throw new UnauthorizedException('User not found in business DB');
      }

      if (!email_verified) {
        const verificationLink = await this.sendEmailVerification(
          email,
          process.env.EMAIL_VERIFICATION_REDIRECT_URL || 'https://restaurant-app-kd2m.onrender.com',
        );

        return {
          message: 'Email is not verified. Verification email has been sent.',
          email,
          verificationLink,
        };
      }

      
      if (userType === Roles.USER_FLEET && !(user as any).status) {
        throw new UnauthorizedException(
          'Your account is pending admin approval. You will be able to login once an admin approves your registration.',
        );
      }

      await this.updateVerificationFlags(firebase_uid, VerificationFlags.EmailVerified, userType);

      const payload: JwtPayload = {
        userId: user.id,
        uid: user.uid,
        role: user.role,
        firebase_uid: firebase_uid,
      };

      const accessToken = this.jwtService.generateAccessToken(payload);
      const refreshToken = await this.jwtService.generateRefreshToken(payload);

      

      return {
        user: {
          ...user,
          verificationFlagsDetails: this.getVerificationDetails(user.verificationFlags),
        },
        fireBaseUser,
        idToken: response.idToken,
        accessToken,
        refreshToken,
        accessTokenExpiresIn: this.jwtService['getExpireInSeconds'](
          this.jwtService['accessTokenExpiresIn'],
        ),
        refreshTokenExpiresIn: this.jwtService['getExpireInSeconds'](
          this.jwtService['refreshTokenExpiresIn'],
        ),
      };
    } catch (error: unknown) {
      console.error('Login failed:', error);

      const err = error as FirebaseError;
      const message = err.response?.data?.error?.message || err.message || 'Unknown login error';

      console.error('Login failed:', message);

      if (message.includes('EMAIL_NOT_FOUND')) {
        throw new BadRequestException('User not found 219.');
      } else if (message.includes('INVALID_PASSWORD')) {
        throw new BadRequestException('Invalid password.');
      } else {
        throw new BadRequestException(message, {
          cause: {
            message: err.message,
            code: err.code,
            errorInfo:
              typeof err === 'object' && err !== null && 'errorInfo' in err
                ? (err as { errorInfo?: unknown }).errorInfo
                : undefined,
            responseData: err.response?.data,
            stack: err.stack,
          },
        });
      }
    }
  }

  public async sendEmailVerification(email: string, redirectUrl: string): Promise<string> {
    try {
      const finalUrl =
        redirectUrl || process.env.FRONTEND_VERIFY_REDIRECT || 'https://yourapp.com/verify-email';

      console.log(`[sendEmailVerification] Generating link for ${email} with url=${finalUrl}`);

      await admin.auth().getUserByEmail(email);

      const link = await admin.auth().generateEmailVerificationLink(email, {
        url: finalUrl,
        handleCodeInApp: true,
      });

      const html = `
      <h2>Email Verification</h2>
      <p>Please click the button below to verify your email address:</p>

      <a href="${link}"
        style="
          padding: 12px 20px;
          background-color: #1E90FF;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-size: 16px;
          display: inline-block;
        "
      >Verify Email</a>

      <p>If the button doesn't work, click the link below:</p>
      <p><a href="${link}">${link}</a></p>

      <p>If you did not request this, you can ignore this email.</p>
    `;

      await this.mailService.sendMail(email, 'Verify Your Email', html);

      return link;
    } catch (error) {
      console.error('Verification Email Error:', error);
      const errMsg = error instanceof Error ? error.message : 'Failed to send verification email';
      if (errMsg.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
        throw new BadRequestException('TOO_MANY_ATTEMPTS_TRY_LATER');
      }
      throw new BadRequestException(errMsg);
    }
  }

  private async updateVerificationFlags(
    firebase_uid: string,
    flags: VerificationFlags | VerificationFlags[],
    userType: string,
  ): Promise<void> {
    let user: any = null;
    let repo: any = null;

    if (userType === Roles.USER_FLEET) {
      repo = this.fleetRepository;
      user = await repo.findOneBy({ firebase_uid });
    } else if (userType === Roles.USER_RESTAURANT) {
      repo = this.restaurantRepository;
      user = await repo.findOneBy({ firebase_uid });
    } else {
      repo = this.userRepository;
      user = await repo.findOneBy({ firebase_uid });
    }

    if (!user) {
      console.warn(`[updateVerificationFlags] User not found for ${userType}: firebase_uid=${firebase_uid}`);
      return;
    }

    const flagList = Array.isArray(flags) ? flags : [flags];
    let updated = false;

    for (const flag of flagList) {
      const alreadyVerified = this.utilService.hasFlag(user.verificationFlags, flag);

      if (!alreadyVerified) {
        user.verificationFlags = this.utilService.setFlag(user.verificationFlags, flag);
        console.log(
          `[updateVerificationFlags] Flag set: user.id=${user.id}, flag=${VerificationFlags[flag]}`,
        );
        updated = true;
      } else {
        console.log(
          `[updateVerificationFlags] Already verified: user.id=${user.id}, flag=${VerificationFlags[flag]}`,
        );
      }
    }

    if (updated) {
      await repo.save(user);
      console.log(`[updateVerificationFlags] User saved: user.id=${user.id}`);
    }
  }

  private getVerificationDetails(flags: number): Record<string, boolean> {
    return {
      AdminVerified: this.utilService.hasFlag(flags, VerificationFlags.AdminVerified),
      EmailVerified: this.utilService.hasFlag(flags, VerificationFlags.EmailVerified),
      MobileVerified: this.utilService.hasFlag(flags, VerificationFlags.MobileVerified),
    };
  }

  async refreshAuthToken(refreshToken: string) {
    try {
      const {
        id_token: idToken,
        refresh_token: newRefreshToken,
        expires_in: expiresIn,
      } = await this.sendRefreshAuthTokenRequest(refreshToken);
      return { idToken, refreshToken: newRefreshToken, expiresIn };
    } catch (error: unknown) {
      const err = error as FirebaseError;
      const message = err.response?.data?.error?.message || err.message || '';
      if (message.includes('INVALID_REFRESH_TOKEN')) {
        throw new Error(`Invalid refresh token: ${refreshToken}.`);
      } else {
        throw new Error('Failed to refresh token');
      }
    }
  }

  private async sendPostRequest<T>(url: string, data: Record<string, unknown>): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.post(url, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as FirebaseError;
      console.error('Error in sendPostRequest:', err.response?.data || err.message);
      throw new Error(err.response?.data?.error?.message || 'Firebase API request failed');
    }
  }

  private async sendRefreshAuthTokenRequest(refreshToken: string) {
    const url = `https://securetoken.googleapis.com/v1/token?key=${this.apiKey}`;
    const payload = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };
    return await this.sendPostRequest<FirebaseRefreshResponse>(url, payload);
  }

  async updatePasswordDirect(email: string, newPassword: string): Promise<void> {
    try {
      const user = await admin.auth().getUserByEmail(email);

      if (!user?.uid) {
        throw new BadRequestException('Firebase user not found.');
      }

      await admin.auth().updateUser(user.uid, { password: newPassword });

      console.log(`Password updated directly for ${email}`);
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to update password.');
    }
  }

  async generatePasswordResetLink(email: string): Promise<string> {
    try {
      await admin.auth().getUserByEmail(email);

      const url = process.env.FRONTEND_RESET_REDIRECT || 'https://yourapp.com/reset-password';
      console.log(`[generatePasswordResetLink] Generating link for ${email} with url=${url}`);

      const link = await admin.auth().generatePasswordResetLink(email, {
        url,
        handleCodeInApp: true,
      });

      const html = `
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>

        <a href="${link}"
          style="
            padding: 12px 20px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            margin-top: 20px;
            display: inline-block;
          "
        >Reset Password</a>

        <p>If the button doesn't work, click the link below:</p>
        <p><a href="${link}">${link}</a></p>

        <p>If you did not request a password reset, you can ignore this email.</p>
      `;

      await this.mailService.sendMail(email, 'Reset Your Password', html);

      return link;
    } catch (error) {
      console.error('Firebase Reset Error:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to generate password reset link',
      );
    }
  }

  async confirmPasswordReset(oobCode: string, newPassword: string): Promise<void> {
    try {
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${this.apiKey}`;

      await axios.post(url, {
        oobCode,
        newPassword,
      });
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Invalid or expired reset code');
    }
  }

  async changeUserPassword(
    firebaseUid: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    console.log('🔥 changeUserPassword START');
    console.log('firebaseUid:', firebaseUid);

    let fbUser: firebaseAdmin.auth.UserRecord;

    try {
      fbUser = await admin.auth().getUser(firebaseUid);
      console.log('🔥 Firebase user found:', {
        uid: fbUser.uid,
        email: fbUser.email,
      });
    } catch (err) {
      console.log('❌ Firebase user not found for UID:', firebaseUid, err);
      throw new BadRequestException('User does not exist in Firebase');
    }

    if (!fbUser.email) {
      console.log('❌ Firebase user has no email');
      throw new BadRequestException('Email not found in Firebase');
    }

    const email = fbUser.email;
    console.log('🔥 Firebase Email:', email);

    const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`;

    console.log('🔥 Verifying old password using Firebase REST...');

    try {
      await axios.post(verifyUrl, {
        email,
        password: oldPassword,
        returnSecureToken: true,
      });

      console.log('✔ Old password verified successfully');
    } catch (err) {
      console.log('❌ Old password verification FAILED');
      console.log(err);
      throw new BadRequestException('Old password is incorrect.');
    }

    console.log('🔥 Updating Firebase password...');
    try {
      await admin.auth().updateUser(firebaseUid, { password: newPassword });
    } catch (err) {
      console.log('❌ Failed to update password in Firebase', err);
      throw new BadRequestException('Failed to update password.');
    }

    console.log('🔥 Revoking refresh tokens...');
    try {
      await admin.auth().revokeRefreshTokens(firebaseUid);
    } catch (err) {
      console.log('⚠ Failed to revoke tokens (non-critical)', err);
    }

    console.log('✔ Password updated successfully in Firebase');
  }

  async getUserByEmail(email: string): Promise<firebaseAdmin.auth.UserRecord | null> {
    try {
      return await admin.auth().getUserByEmail(email);
    } catch (e) {
      return null;
    }
  }

  async deleteUser(uid: string): Promise<void> {
    await admin.auth().deleteUser(uid);
  }

  /**
   * Safely delete a Firebase user ONLY if no other roles (User, Restaurant, Fleet)
   * are currently using this firebase_uid in our database.
   */
  async deleteUserIfUnused(firebaseUid: string): Promise<void> {
    if (!firebaseUid) return;

    try {
      const userCount = await this.userRepository.count({ where: { firebase_uid: firebaseUid } });
      const restaurantCount = await this.restaurantRepository.count({ where: { firebase_uid: firebaseUid } });
      const fleetCount = await this.fleetRepository.count({ where: { firebase_uid: firebaseUid } });

      if (userCount === 0 && restaurantCount === 0 && fleetCount === 0) {
        console.log(`🗑️ No roles found for UID ${firebaseUid}. Deleting from Firebase...`);
        await this.deleteUser(firebaseUid);
        console.log(`✅ Firebase user ${firebaseUid} deleted successfully.`);
      } else {
        console.log(`🛑 Firebase user ${firebaseUid} is still in use by other roles. Skipping deletion.`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to check/delete Firebase user ${firebaseUid}:`, error);
    }
  }
}
