import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RegisterFleetDto } from './dto/registerFleet.dto';
import { FleetLoginEmailDto, FleetLoginOtpDto } from './dto/login.dto';

import { FirebaseService } from 'src/firebase/firebase.service';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { SessionService } from 'src/auth/session.service';
import { Roles } from 'src/constants/app.enums';
import { UtilService } from 'src/utils/util.service';

import { signupWithEmail } from './utils/singupWithEmailFleet.utils';


import { Fleet } from './entity/fleet.entity';
import { FleetContact } from './entity/fleet_contact.entity';
import { FleetAddress } from './entity/fleet_address.entity';
import { FleetProfile } from './entity/fleet_profile.entity';
import { FleetBankDetails } from './entity/fleet_bank_details.entity';
import { FleetDocument } from './entity/fleet-document.entity';
import { FleetEmergencyContact } from './entity/fleet_emergency_contact.entity';

import { CreateFleetDto } from './dto/createFleet.dto';
import { UpdateFleetDto } from './dto/updateFleetdto';
import { OtpEntity } from 'src/otp/otp.entity';
import { UpdateFleetAddressDto } from './dto/update-fleet-address.dto';
import { WorkType } from 'src/work-type/work-type.entity';
import { UpdateWorkTimeDto } from './dto/update-work-time.dto';
import { UpdateBreakTimeDto } from './dto/update-break-time.dto';
import { ResetPasswordOtpDto } from './dto/reset-password-otp.dto';
import { MailService } from 'src/mail/mail.service';
import { UpdateFleetBankDto } from './dto/udate-bank.dto';
import { UpdateFleetProfileDto } from './dto/update-fleet-profile.dto';
import { fleetStatusByAdminUtil, toggleFleetIsActiveUtil } from './utils/active-status.utils';
import { NotificationService } from 'src/notifications/notification.service';

@Injectable()
export class FleetsService {
  constructor(
    @InjectRepository(OtpEntity)
    private readonly otpRepository: Repository<OtpEntity>,
    @InjectRepository(Fleet)
    private readonly fleetRepository: Repository<Fleet>,

    @InjectRepository(FleetContact)
    private readonly fleetContactRepository: Repository<FleetContact>,

    @InjectRepository(FleetAddress)
    private readonly fleetAddressRepository: Repository<FleetAddress>,

    @InjectRepository(FleetProfile)
    private readonly fleetProfileRepository: Repository<FleetProfile>,

    @InjectRepository(FleetDocument)
    private readonly fleetDocumentsRepository: Repository<FleetDocument>,

    @InjectRepository(FleetBankDetails)
    private readonly fleetBankDetailsRepository: Repository<FleetBankDetails>,

    @InjectRepository(WorkType)
    private readonly workTypeRepository: Repository<WorkType>,

    @InjectRepository(FleetEmergencyContact)
    private readonly fleetEmergencyContactRepository: Repository<FleetEmergencyContact>,

    private readonly firebaseService: FirebaseService,
    private readonly jwtService: JwtServiceShared,
    private readonly sessionService: SessionService,
    private readonly utilService: UtilService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
  ) { }


  async create(createFleetDto: CreateFleetDto): Promise<Fleet> {
    const fleet = this.fleetRepository.create({
      ...createFleetDto,
      emergencyContacts: createFleetDto.emergencyContacts ?? [],
    });

    return await this.fleetRepository.save(fleet);
  }


  async signupWithEmail(registerUserDto: RegisterFleetDto) {
    return await signupWithEmail(registerUserDto, {
      fleetRepository: this.fleetRepository,
      fleetContactRepository: this.fleetContactRepository,
      fleetProfileRepository: this.fleetProfileRepository,
      fleetBankDetailsRepository: this.fleetBankDetailsRepository,
      fleetAddressRepository: this.fleetAddressRepository,
      fleetDocumentsRepository: this.fleetDocumentsRepository,
      fleetEmergencyContactRepository: this.fleetEmergencyContactRepository,
      workTypeRepository: this.workTypeRepository,
      firebaseService: this.firebaseService,
      jwtService: this.jwtService,
      sessionService: this.sessionService,
      utilService: this.utilService,
      mailService: this.mailService,
      notificationService: this.notificationService,
    });
  }


  async loginwithOtp(payload: FleetLoginOtpDto) {
    const { phone, otp } = payload;

    const contact = await this.fleetContactRepository.findOne({
      where: { encryptedPhone: phone },
    });

    if (!contact) {
      throw new UnauthorizedException('Phone number not found');
    }

    const plainPhone = contact.contactPhone;

    const record = await this.otpRepository.findOne({
      where: { phone: plainPhone, isVerified: false },
      order: { createdAt: 'DESC' },
    });

    if (!record) throw new UnauthorizedException('Invalid user or Otp');

    if (new Date() > record.expiresAt) throw new UnauthorizedException('OTP expired');

    if (record.otp !== otp) throw new UnauthorizedException('Invalid OTP');

    record.isVerified = true;
    await this.otpRepository.save(record);

    const userInDb = await this.fleetRepository.findOne({
      where: { uid: contact.fleetUid },
      relations: ['contact', 'bank_details', 'address', 'emergencyContacts'],
    });

    if (!userInDb) {
      throw new UnauthorizedException('Fleet not registered in app DB');
    }

    if (!userInDb.status) {
      throw new UnauthorizedException(
        'Your account is pending admin approval. You will be able to login once an admin approves your registration.',
      );
    }


    const payloadJwt = {
      uid: userInDb.uid,
      userId: userInDb.id,
      role: userInDb.role,
      firebase_uid: userInDb.firebase_uid,
    };

    const accessToken = this.jwtService.generateAccessToken(payloadJwt);
    const refreshToken = await this.jwtService.generateRefreshToken(payloadJwt);

    await this.sessionService.createFleetSession(userInDb, refreshToken);

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


  async loginWithEmail(payload: FleetLoginEmailDto) {
    const userType = Roles.USER_FLEET;
    const { email, password } = payload;

    type FirebaseLoginResponse = {
      user?: { firebase_uid: string;[key: string]: any };
    };

    const firebaseResponse = (await this.firebaseService.loginUser(
      email,
      password,
      userType,
    )) as FirebaseLoginResponse;

    if (!firebaseResponse.user) {
      return firebaseResponse;
    }

    const userInDb = await this.fleetRepository.findOne({
      where: { firebase_uid: firebaseResponse.user.firebase_uid },
      relations: ['contact', 'bank_details', 'address', 'emergencyContacts'],
    });

    if (!userInDb) {
      throw new UnauthorizedException('Fleet not registered in app DB');
    }


    const payloadJwt = {
      uid: userInDb.uid,
      userId: userInDb.id,
      email,
      role: userInDb.role,
      firebase_uid: userInDb.firebase_uid,
    };

    const accessToken = this.jwtService.generateAccessToken(payloadJwt);
    const refreshToken = await this.jwtService.generateRefreshToken(payloadJwt);

    await this.sessionService.createFleetSession(userInDb, refreshToken);

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

  async checkPhoneExists(phone: string): Promise<boolean> {
    const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const rawPhone = phone.replace('+91', '').replace('+', '');

    const contact = await this.fleetContactRepository.findOne({
      where: [
        { encryptedPhone: phone },
        { encryptedPhone: normalizedPhone },
        { encryptedPhone: rawPhone },
        { contactPhone: phone },
        { contactPhone: normalizedPhone },
        { contactPhone: rawPhone },
      ],
    });
    return !!contact;
  }


  async findByUid(uid: string): Promise<Fleet> {
    const user = await this.fleetRepository.findOne({
      where: { uid },
      relations: ['contact', 'bank_details', 'address', 'profile', 'profile.work_type', 'emergencyContacts', 'documents'],
    });

    if (!user) {
      throw new NotFoundException(`Fleet with uid=${uid} not found`);
    }

    return user;
  }

  async toggleStatus(id: number): Promise<Fleet> {
    const fleet = await this.fleetRepository.findOne({ where: { id } });

    if (!fleet) {
      throw new NotFoundException('Fleet not found');
    }

    const updatedStatus = !fleet.status;

    await this.fleetRepository.update(id, { status: updatedStatus });

    return this.findOne(id);
  }



  async refreshAuthToken(@Query('refreshToken') refreshToken: string) {

    const decoded = this.jwtService.verifyRefreshToken(refreshToken);


    const session = await this.sessionService.findFleetSessionByRefreshToken(refreshToken);
    if (!session) {
      throw new UnauthorizedException('Session not found (invalid refresh token)');
    }


    const user = await this.fleetRepository.findOne({
      where: { id: session.fleetId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.status) {
      throw new UnauthorizedException(
        'Your account is currently inactive or pending approval. Please contact admin.',
      );
    }


    const payloadJwt = {
      uid: user.uid,
      userId: user.id,
      role: user.role,
      firebase_uid: user.firebase_uid,
    };

    const accessToken = this.jwtService.generateAccessToken(payloadJwt);
    const newRefreshToken = await this.jwtService.generateRefreshToken(payloadJwt);


    await this.sessionService.deleteFleetSession(refreshToken);
    await this.sessionService.createFleetSession(user, newRefreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      accessTokenExpiresIn: this.jwtService.getExpireInSeconds(
        this.jwtService['accessTokenExpiresIn'],
      ),
      refreshTokenExpiresIn: this.jwtService.getExpireInSeconds(
        this.jwtService['refreshTokenExpiresIn'],
      ),
    };
  }


  async findAll(): Promise<Fleet[]> {
    return await this.fleetRepository.find();
  }


  async findOne(id: number): Promise<Fleet> {
    const user = await this.fleetRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Fleet with ID ${id} not found`);
    }
    return user;
  }


  async update(id: number, updateUserDto: UpdateFleetDto): Promise<Fleet> {
    await this.fleetRepository.update(id, updateUserDto);
    return await this.findOne(id);
  }


  async remove(id: number): Promise<void> {
    const result = await this.fleetRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Fleet with ID ${id} not found`);
    }
  }

  async updateAddress(fleetUid: string, dto: UpdateFleetAddressDto) {
    const address = await this.fleetAddressRepository.findOne({
      where: { fleetUid },
    });

    if (!address) {
      throw new BadRequestException('Address not found for this user');
    }

    Object.assign(address, dto);

    return await this.fleetAddressRepository.save(address);
  }

  async updateWorkTime(fleetUid: string, dto: UpdateWorkTimeDto) {
    const profile = await this.fleetProfileRepository.findOne({
      where: { fleetUid },
    });

    if (!profile) {
      throw new NotFoundException('Fleet profile not found');
    }

    profile.start_time = dto.start_time ?? profile.start_time;
    profile.end_time = dto.end_time ?? profile.end_time;

    await this.fleetProfileRepository.save(profile);

    return {
      status: 'success',
      message: 'Work time updated successfully',
      data: profile,
    };
  }

  async updateBreakTime(fleetUid: string, dto: UpdateBreakTimeDto) {
    const profile = await this.fleetProfileRepository.findOne({
      where: { fleetUid },
    });

    if (!profile) {
      throw new NotFoundException('Fleet profile not found');
    }

    profile.break_start_time = dto.break_start_time ?? profile.break_start_time;
    profile.break_end_time = dto.break_end_time ?? profile.break_end_time;

    await this.fleetProfileRepository.save(profile);

    return {
      status: 'success',
      message: 'Break time updated successfully',
      data: profile,
    };
  }

  async updateFleetAddress(fleetUid: string, dto: UpdateFleetAddressDto) {
    const address = await this.fleetAddressRepository.findOne({ where: { fleetUid } });

    if (!address) throw new NotFoundException('Fleet address not found');

    Object.assign(address, dto);
    return this.fleetAddressRepository.save(address);
  }

  async updateFleetBank(fleetUid: string, dto: UpdateFleetBankDto) {
    const bank = await this.fleetBankDetailsRepository.findOne({ where: { fleetUid } });

    if (!bank) throw new NotFoundException('Fleet bank details not found');

    Object.assign(bank, dto);
    
    // Automatically reset Razorpay safety flags if bank info changes
    bank.verified = false;
    bank.razorpay_accid = null as unknown as string;

    return this.fleetBankDetailsRepository.save(bank);
  }

  async updateFleetProfile(fleetUid: string, dto: UpdateFleetProfileDto) {
    const profile = await this.fleetProfileRepository.findOne({
      where: { fleetUid },
    });

    if (!profile) {
      throw new NotFoundException('Fleet profile not found');
    }

    delete dto['referral_code'];

    Object.assign(profile, dto);

    const updated = await this.fleetProfileRepository.save(profile);

    return {
      status: 'success',
      code: 200,
      message: 'Profile updated successfully',
      data: { profile: updated },
      meta: { timestamp: new Date().toISOString() },
    };
  }

  async myProfile(uid: string) {
    return await this.fleetRepository.findOne({
      where: { uid },
      relations: [
        'contact',
        'address',
        'profile',
        'profile.work_type',
        'bank_details',
        'documents',
      ],
    });
  }

  async toggleFleetIsActive(fleetUid: string) {
    return await toggleFleetIsActiveUtil(this.fleetRepository, fleetUid);
  }

  async fleetStatusByAdmin(
    adminUid: string,
    fleetUid: string,
    body: { status?: number | boolean; isActive?: number | boolean },
  ) {
    return await fleetStatusByAdminUtil(this.fleetRepository, fleetUid, body);
  }


  async resetPasswordWithOtp(dto: ResetPasswordOtpDto) {
    const { phone, otp, newPassword } = dto;

    const record = await this.otpRepository.findOne({
      where: { phone },
      order: { createdAt: 'DESC' },
    });

    if (!record) throw new BadRequestException('Invalid user or Otp');
    if (new Date() > record.expiresAt) throw new BadRequestException('OTP expired');
    if (record.otp !== otp) throw new BadRequestException('Invalid OTP');



    if (!record.isVerified) {
      record.isVerified = true;
      await this.otpRepository.save(record);
    }


    const contact = await this.fleetContactRepository.findOne({
      where: { encryptedPhone: phone },
    });
    if (!contact) throw new NotFoundException('Fleet not found');

    const user = await this.fleetRepository.findOne({ where: { uid: contact.fleetUid } });
    if (!user) throw new NotFoundException('Fleet user not found');
    if (!user.firebase_uid) throw new BadRequestException('User not linked to Firebase');

    const email = contact.encryptedEmail;
    await this.firebaseService.updatePasswordDirect(email, newPassword);

    return { status: 'success', message: 'Password updated successfully' };
  }

  /**
   * 🗑️ PERMANENTLY DELETE FLEET PARTNER
   */
  async permanentlyDeleteFleet(fleetUid: string) {
    const fleet = await this.fleetRepository.findOne({ where: { uid: fleetUid } });
    if (!fleet) {
      throw new NotFoundException('Fleet partner not found');
    }

    return this._deleteFleetData(fleet);
  }

  async deleteMyAccount(fleetUid: string) {
    const fleet = await this.fleetRepository.findOne({ where: { uid: fleetUid } });
    if (!fleet) {
      throw new NotFoundException('Fleet partner not found');
    }

    return this._deleteFleetData(fleet);
  }

  private async _deleteFleetData(fleet: Fleet) {
    const fleetUid = fleet.uid;

    const queryRunner = this.fleetRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      await queryRunner.manager.delete('fleet_contacts', { fleetUid });
      await queryRunner.manager.delete('fleet_address', { fleetUid });
      await queryRunner.manager.delete('fleet_profile', { fleetUid });
      await queryRunner.manager.delete('fleet_bank_details', { fleetUid });
      await queryRunner.manager.delete('fleet_documents', { fleetUid });
      await queryRunner.manager.delete('fleet_working_hours', { fleetUid });
      await queryRunner.manager.delete('fleet_emergency_contacts', { fleetUid });
      await queryRunner.manager.delete('sessions', { fleetUid });

      // Delete tables with FK referencing fleets.uid
      await queryRunner.manager.query(
        `DELETE FROM delivery_history WHERE fleet_uid = $1`,
        [fleetUid],
      );
      // await queryRunner.manager.query(
      //   `DELETE FROM shift_change_requests WHERE fleet_uid = $1`,
      //   [fleetUid],
      // );

      // Now safe to delete the fleet row
      await queryRunner.manager.delete(Fleet, { uid: fleetUid });

      await queryRunner.commitTransaction();

      // --- NEW: Safe Firebase Deletion AFTER DB transaction is committed ---
      if (fleet.firebase_uid) {
        await this.firebaseService.deleteUserIfUnused(fleet.firebase_uid);
      }

      return { success: true, message: 'Account deleted successfully' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('Database deletion failed:', err);
      throw new BadRequestException('Failed to delete account');
    } finally {
      await queryRunner.release();
    }
  }

  async getVehicleTypes() {
    const vehicleTypes = await this.fleetRepository
      .createQueryBuilder('fleet')
      .leftJoin('fleet.documents', 'doc')
      .select('DISTINCT doc.vehicle_type', 'vehicleType')
      .where('doc.vehicle_type IS NOT NULL')
      .getRawMany();

    const uniqueTypes = vehicleTypes
      .map((v) => v.vehicleType)
      .filter((type): type is string => type !== null && type !== undefined);

    return {
      status: 'success',
      code: 200,
      data: uniqueTypes.map((type, index) => ({ id: index + 1, name: type })),
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
