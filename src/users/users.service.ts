

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginEmailDto, LoginOtpDto } from './dto/login.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { UserContact } from './user_contact.entity';
import { CreateUserContactDto } from './dto/CreateUserContact.dto';
import { JwtServiceShared } from '../shared/jwt.service';
import { SessionService } from '../auth/session.service';
import { ProviderType, Roles } from '../constants/app.enums';
import { BankDetails } from './bank_details.entity';
import { UserAddress } from './user_address.entity';
import { UtilService } from '../utils/util.service';
import { OtpEntity } from '../otp/otp.entity';
import { MailService } from '../mail/mail.service';
import { UpdateUserProfileDto } from './dto/update-profile.dto';
import { UserProfile } from './user_profile.entity';
import { toggleUserIsActiveUtil, userStatusByAdminUtil } from './utils/user-status.utils';
import { ReferralService } from 'src/referral/referral.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OtpEntity)
    private readonly otpRepository: Repository<OtpEntity>,
    @InjectRepository(UserContact)
    private readonly userContactRepository: Repository<UserContact>,
    @InjectRepository(UserAddress)
    private readonly userAddressRepository: Repository<UserAddress>,
    @InjectRepository(BankDetails)
    private readonly bankDetailsRepository: Repository<BankDetails>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly firebaseService: FirebaseService,
    private readonly jwtService: JwtServiceShared,
    private readonly sessionService: SessionService,
    private readonly utilService: UtilService,
    private readonly mailService: MailService,
    private readonly referralService: ReferralService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }




  async signupWithEmail(registerUserDto: RegisterUserDto) {
    const {
      firstName,
      lastName,
      photo,
      email,
      phoneNumber,
      password,
      bank_details,
      address,
      dob,
      anniversary,
      tnc_accepted,
    } = registerUserDto;

    const existingContact = await this.userContactRepository.findOne({
      where: [{ encryptedEmail: email }, { encryptedPhone: phoneNumber }],
    });
    if (existingContact) {
      throw new BadRequestException('Users Email or phone number already exists.');
    }

    // --- NEW: Validate referral code BEFORE any Firebase/DB creation
    if (registerUserDto.refer_code) {
      await this.referralService.validateReferCode(registerUserDto.refer_code);
    }
    // -----------------------------------------------------------------

    let firebaseAccount;
    try {
      firebaseAccount = await this.firebaseService.registerUser(
        firstName,
        lastName,
        email,
        password,
      );
    } catch (error) {
      if (
        (error as any).code === 'auth/email-already-exists' ||
        (error as any).code === 'auth/email-already-in-use'
      ) {


        // Reuse the existing Firebase account instead of deleting it
        firebaseAccount = await this.firebaseService.getUserByEmail(email);
        if (!firebaseAccount) {
          throw new BadRequestException('Failed to retrieve existing user from Firebase.');
        }
      } else {
        throw error;
      }

    }

    const uid = await this.utilService.generateUniqueUid(async (generatedUid) => {
      const existingUid = await this.userRepository.findOne({ where: { uid: generatedUid } });
      return !!existingUid;
    });

    const createUserDto: CreateUserDto = {
      uid: uid + 'UsR',
      firebase_uid: firebaseAccount.uid,
      firstName,
      lastName,
      photo: Array.isArray(photo) ? photo : photo ? [photo] : [],
      role: Roles.USER_CUSTOMER,
      providerType:
        (firebaseAccount.providerData?.[0]?.providerId as ProviderType) ||
        ('email' as ProviderType),
    };

    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);

    const createUserContactDto: CreateUserContactDto = {
      userUid: savedUser.uid,
      encryptedEmail: email,
      encryptedPhone: phoneNumber,
    };
    const userContact = this.userContactRepository.create(createUserContactDto);
    await this.userContactRepository.save(userContact);

    const bankDetails = this.bankDetailsRepository.create({
      user: savedUser,
      bank_name: bank_details?.bank_name ?? '',
      ifsc_code: bank_details?.ifsc_code ?? '',
      account_number: bank_details?.account_number ?? '',
      account_type: bank_details?.account_type ?? '',
    });
    await this.bankDetailsRepository.save(bankDetails);

    const userAddress = this.userAddressRepository.create({
      user: savedUser,
      city: address?.city ?? '',
      state: address?.state ?? '',
      pincode: address?.pincode ?? '',
      lat: Number(address?.lat) || 0.0,
      lng: Number(address?.lng) || 0.0,
    });
    await this.userAddressRepository.save(userAddress);

    const safePhotoArray: string[] = Array.isArray(photo)
      ? photo.map((p) => String(p))
      : typeof photo === 'string'
        ? [photo]
        : [];

    const profile = this.profileRepo.create({
      user: savedUser,
      first_name: firstName ?? '',
      last_name: lastName ?? '',
      photo: safePhotoArray,
      dob: dob || null,
      anniversary: anniversary || null,
      tnc_accepted: tnc_accepted ?? false,
    });
    await this.profileRepo.save(profile);

    const verifyLink = await this.firebaseService.sendEmailVerification(
      email,
      process.env.EMAIL_VERIFICATION_REDIRECT_URL || 'https://zenzio.in',
    );

    const html = `
      <h2>Welcome to Zenzio</h2>
      <p>Please verify your email address to activate your account.</p>
      <a href="${verifyLink}" style="background:#1c7ed6;color:white;padding:10px 18px;
      text-decoration:none;border-radius:8px;display:inline-block;margin-top:10px;">
      Verify Email
      </a>
      <p>If button doesn't work, open this link:</p>
      <p>${verifyLink}</p>
    `;

    await this.mailService.sendMail(email, 'Verify Your Zenzio Account', html);

    // Generate and save a unique refer_code for the new user
    await this.referralService.generateAndSaveReferCode(savedUser.uid);

    // If a referral code was provided at signup, apply it (silent fail if invalid)
    if (registerUserDto.refer_code) {
      await this.referralService.applyReferCode(savedUser.uid, registerUserDto.refer_code);
    }

    const fullUser = await this.userRepository.findOne({
      where: { uid: savedUser.uid },
      relations: ['contact', 'bank_details', 'profile'],
    });

    return {
      fullUser,
      accessToken: '',
      refreshToken: ''
    };
  }




  async loginWithEmail(payload: LoginEmailDto) {
    const userType = Roles.USER_CUSTOMER;
    const { email, password } = payload;

    type FirebaseLoginResponse = {
      user?: { firebase_uid: string;[key: string]: any };
      [key: string]: any;
    };

    const firebaseResponse = (await this.firebaseService.loginUser(
      email,
      password,
      userType,
    )) as FirebaseLoginResponse;

    if (!firebaseResponse.user) return firebaseResponse;

    const userInDb = await this.userRepository.findOne({
      where: {
        firebase_uid: firebaseResponse.user.firebase_uid,
        role: userType,
      },
      relations: ['contact', 'bank_details', 'address'],
    });

    if (!userInDb) throw new UnauthorizedException('User not registered in app DB');


    const payloadJwt = {
      uid: userInDb.uid,
      userId: userInDb.id,
      firebase_uid: userInDb.firebase_uid,
      email,
      role: userInDb.role,
    };

    const accessToken = this.jwtService.generateAccessToken(payloadJwt);
    const refreshToken = await this.jwtService.generateRefreshToken(payloadJwt);

    await this.sessionService.createSession(userInDb, refreshToken);

    return {
      user: {
        id: userInDb.id,
        uid: userInDb.uid,
        firebase_uid: userInDb.firebase_uid,
        providerType: userInDb.providerType,
        role: userInDb.role,
        status: userInDb.status,
        verificationFlags: userInDb.verificationFlags,
        createdAt: userInDb.createdAt,
        updatedAt: userInDb.updatedAt,
      },
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.jwtService.getExpireInSeconds(
        this.jwtService['accessTokenExpiresIn'],
      ),
      refreshTokenExpiresIn: this.jwtService.getExpireInSeconds(
        this.jwtService['refreshTokenExpiresIn'],
      ),
    };
  }




  async loginWithOtp(payload: LoginOtpDto) {
    const { phone, otp } = payload;

    const contact = await this.userContactRepository.findOne({
      where: { encryptedPhone: phone },
    });

    if (!contact) throw new UnauthorizedException('Phone number not found');

    const record = await this.otpRepository.findOne({
      where: { phone: contact.encryptedPhone, isVerified: false },
      order: { createdAt: 'DESC' },
    });

    if (!record) throw new UnauthorizedException('Invalid user or Otp');

    if (new Date() > record.expiresAt) throw new UnauthorizedException('OTP expired');

    if (record.otp !== otp) throw new UnauthorizedException('Invalid OTP');

    record.isVerified = true;
    await this.otpRepository.save(record);

    const userInDb = await this.userRepository.findOne({
      where: { uid: contact.userUid },
      relations: ['contact', 'address'],
    });

    if (!userInDb) throw new UnauthorizedException('Restaurant not registered in app DB');


    const payloadJwt = {
      uid: userInDb.uid,
      userId: userInDb.id,
      firebase_uid: userInDb.firebase_uid,
      role: userInDb.role,
    };

    const accessToken = this.jwtService.generateAccessToken(payloadJwt);
    const refreshToken = await this.jwtService.generateRefreshToken(payloadJwt);

    await this.sessionService.createSession(userInDb, refreshToken);

    return {
      user: {
        id: userInDb.id,
        uid: userInDb.uid,
        firebase_uid: userInDb.firebase_uid,
        providerType: userInDb.providerType,
        role: userInDb.role,
        status: userInDb.status,
        verificationFlags: userInDb.verificationFlags,
        createdAt: userInDb.createdAt,
        updatedAt: userInDb.updatedAt,
      },
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.jwtService.getExpireInSeconds(
        this.jwtService['accessTokenExpiresIn'],
      ),
      refreshTokenExpiresIn: this.jwtService.getExpireInSeconds(
        this.jwtService['refreshTokenExpiresIn'],
      ),
    };
  }


  async findByUid(uid: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { uid },
      relations: ['contact', 'bank_details', 'address', 'profile'],
    });

    if (!user) throw new NotFoundException(`User with uid=${uid} not found`);

    user['fullAddress'] = [
      user.address?.address,
      user.address?.address_secondary,
      user.address?.city,
      user.address?.state,
      user.address?.pincode,
    ].filter(Boolean).join(', ');

    return user;
  }

  async refreshAuthToken(@Query('refreshToken') refreshToken: string) {
    return this.firebaseService.refreshAuthToken(refreshToken);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async removeByUid(uid: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { uid } });
    if (!user) {
      throw new NotFoundException(`User with UID ${uid} not found`);
    }

    console.log(`🗑️ Starting deletion for user: ${uid} (Firebase: ${user.firebase_uid})`);


    try {
      await this.userContactRepository.delete({ userUid: uid });
      await this.userAddressRepository.delete({ userUid: uid });
      await this.profileRepo.delete({ userUid: uid });
      await this.bankDetailsRepository.delete({ userId: user.id as any });
      await this.sessionService.deleteSessionsForUser(uid);
      console.log('✅ Related records deleted');
    } catch (e) {
      console.warn(`⚠️ Error deleting related records: ${e}`);
    }

    const firebase_uid = user.firebase_uid;

    const result = await this.userRepository.delete({ uid });
    if (result.affected === 0) {
      throw new NotFoundException(`User with UID ${uid} not found`);
    }

    console.log(`✅ User ${uid} deleted entirely from DB`);

    // --- NEW: Safe Firebase Deletion AFTER local DB is gone ---
    if (firebase_uid) {
      await this.firebaseService.deleteUserIfUnused(firebase_uid);
    }
  }

  async getMyFullProfile(uid: string) {
    const user = await this.userRepository.findOne({
      where: { uid },
      relations: ['contact', 'profile'],
    });

    if (!user) throw new NotFoundException(`User with uid=${uid} not found`);

    return user;
  }

  async updateByUid(user_uid: string, dto: UpdateUserProfileDto) {
    console.log('[updateByUid] Input: user_uid=%s, dto=%o', user_uid, dto);

    const user = await this.userRepository.findOne({
      where: { uid: user_uid },
      relations: ['profile'],
    });

    if (!user) throw new NotFoundException(`User with uid=${user_uid} not found`);

    // Create profile if it doesn't exist (upsert)
    if (!user.profile) {
      console.log('[updateByUid] Creating new profile for user: %s', user_uid);
      user.profile = await this.profileRepo.save({
        userUid: user_uid,
        user: user,
      });
    }

    // Handle password update via Firebase (not stored in local DB)
    if (dto.password && dto.password.trim().length > 0) {
      const contact = await this.userContactRepository.findOne({ where: { userUid: user_uid } });
      if (!contact?.encryptedEmail) {
        throw new BadRequestException('Cannot update password: user email not found.');
      }
      await this.firebaseService.updatePasswordDirect(contact.encryptedEmail, dto.password);
    }

    // Strip password from profile update payload
    const { password, ...profileData } = dto;
    Object.assign(user.profile, profileData);

    const saved = await this.profileRepo.save(user.profile);
    console.log('[updateByUid] DB Result:', JSON.stringify(saved));
    return saved;
  }

  async toggleUserIsActive(userUid: string) {
    return await toggleUserIsActiveUtil(this.userRepository, userUid);
  }

  async userStatusByAdmin(
    userUid: string,
    body: { status?: number | boolean; isActive?: number | boolean },
  ) {
    return await userStatusByAdminUtil(this.userRepository, userUid, body);
  }

  async toggleNotifications(user_uid: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { uid: user_uid } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.notificationsEnabled = !user.notificationsEnabled;
    await this.userRepository.save(user);

    return user.notificationsEnabled;
  }

  async getCustomerStats() {
    const totalCustomers = await this.userRepository.count();
    const activeCustomers = await this.userRepository.count({ where: { isActive: true } });
    const inactiveCustomers = await this.userRepository.count({ where: { isActive: false } });

    return {
      status: 'success',
      code: 200,
      data: {
        total: totalCustomers,
        active: activeCustomers,
        inactive: inactiveCustomers,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
