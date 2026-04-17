import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import * as firebaseAdmin from 'firebase-admin';
import { RegisterFleetDto } from '../dto/registerFleet.dto';
import { CreateFleetDto } from '../dto/createFleet.dto';

import { FleetContact } from '../entity/fleet_contact.entity';
import { FleetProfile } from '../entity/fleet_profile.entity';
import { FleetBankDetails } from '../entity/fleet_bank_details.entity';
import { FleetAddress } from '../entity/fleet_address.entity';
import { FleetEmergencyContact } from '../entity/fleet_emergency_contact.entity';

import { FirebaseService } from 'src/firebase/firebase.service';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { SessionService } from 'src/auth/session.service';
import { UtilService } from 'src/utils/util.service';
import { Roles, ProviderType } from 'src/constants/app.enums';
import { Fleet } from '../entity/fleet.entity';
import { FleetDocument } from '../entity/fleet-document.entity';
import { WorkType } from 'src/work-type/work-type.entity';
import { MailService } from 'src/mail/mail.service';
import { NotificationService } from 'src/notifications/notification.service';

function normalizeFiles(input?: string | string[]): string[] {
  if (!input) return [];
  return Array.isArray(input) ? input : [input];
}

export interface SignupWithEmailDeps {
  fleetRepository: Repository<Fleet>;
  fleetContactRepository: Repository<FleetContact>;
  fleetProfileRepository: Repository<FleetProfile>;
  fleetBankDetailsRepository: Repository<FleetBankDetails>;
  fleetAddressRepository: Repository<FleetAddress>;
  fleetEmergencyContactRepository: Repository<FleetEmergencyContact>;
  fleetDocumentsRepository: Repository<FleetDocument>;
  workTypeRepository: Repository<WorkType>;
  firebaseService: FirebaseService;
  jwtService: JwtServiceShared;
  sessionService: SessionService;
  utilService: UtilService;
  mailService: MailService;
  notificationService: NotificationService;
}

export async function signupWithEmail(
  registerUserDto: RegisterFleetDto,
  deps: SignupWithEmailDeps,
) {
  const {
    fleetRepository,
    fleetContactRepository,
    fleetProfileRepository,
    fleetBankDetailsRepository,
    fleetAddressRepository,
    fleetEmergencyContactRepository,
    fleetDocumentsRepository,
    workTypeRepository,
    firebaseService,
    jwtService,
    sessionService,
    utilService,
    mailService,
    notificationService,
  } = deps;

  const {
    firstName,
    lastName,
    photo,
    email,
    phoneNumber,
    password,
    dob,
    referral_code,
    bank_details,
    address,
    emergencyContacts,
    documents,
  } = registerUserDto;

  const dataSource: DataSource = fleetRepository.manager.connection;

  const invalidFields: string[] = [];

  if (!firstName || firstName.trim() === '') {
    invalidFields.push('firstName is required');
  }

  if (!phoneNumber || phoneNumber.trim() === '') {
    invalidFields.push('phoneNumber is required');
  }
  if (!password || password.length < 6) {
    invalidFields.push('password must be at least 6 characters');
  }

  let workTypeData: WorkType | null = null;
  if (registerUserDto.work_type_uid) {
    workTypeData = await workTypeRepository.findOne({
      where: { work_type_uid: registerUserDto.work_type_uid },
    });

    if (!workTypeData) {
      invalidFields.push('Invalid work_type_uid');
    }
  }

  const finalEmail =
    email && email.trim() !== ''
      ? email.trim()
      : `${phoneNumber.trim().replace(/\+/g, '')}@zenzio-guest.in`;

  const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
  const rawPhone = phoneNumber.replace('+91', '').replace('+', '');

  const whereConditions: any[] = [
    { encryptedPhone: phoneNumber },
    { encryptedPhone: normalizedPhone },
    { encryptedPhone: rawPhone },
    { contactPhone: phoneNumber },
    { contactPhone: normalizedPhone },
    { contactPhone: rawPhone },
  ];
  if (email && email.trim() !== '') {
    whereConditions.push({ encryptedEmail: email.trim() });
    whereConditions.push({ contactEmail: email.trim() });
  }

  const existingContact = await fleetContactRepository.findOne({
    where: whereConditions,
  });

  if (existingContact) {
    invalidFields.push('Fleet email or phone already exists');
  }

  if (bank_details) {
    if (bank_details.account_number && !bank_details.ifsc_code) {
      invalidFields.push('IFSC code is required when account number is provided');
    }
  }

  if (address) {
    if (address.lat !== undefined && (address.lat < -90 || address.lat > 90)) {
      invalidFields.push('Invalid latitude value');
    }
    if (address.lng !== undefined && (address.lng < -180 || address.lng > 180)) {
      invalidFields.push('Invalid longitude value');
    }
  }

  if (invalidFields.length > 0) {
    console.error(`[SIGNUP VALIDATION FAILED] ${JSON.stringify(invalidFields)}`);
    throw new BadRequestException({
      statusCode: 400,
      message: 'Invalid fields',
      details: invalidFields,
      error: 'BadRequestException',
    });
  }

  let firebaseAccount: any;
  try {
    firebaseAccount = await firebaseService.registerUser(firstName, lastName, finalEmail, password);
  } catch (firebaseError: any) {
    throw new BadRequestException({
      statusCode: 400,
      message: 'Firebase registration failed',
      details: [firebaseError.message || 'Could not create Firebase account'],
      error: 'BadRequestException',
    });
  }

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const uid = await utilService.generateUniqueUid(async (generatedUid) => {
      const exists = await queryRunner.manager.findOne(Fleet, { where: { uid: generatedUid } });
      return !!exists;
    });

    const fullFleetUid = uid + 'FLT';

    const createFleetDto: CreateFleetDto = {
      uid: fullFleetUid,
      firebase_uid: firebaseAccount.uid,
      firstName,
      lastName,
      photo,
      role: Roles.USER_FLEET,
      providerType: ProviderType.PASSWORD,
      status: false,
      isActive: false,
    };

    const fleet = queryRunner.manager.create(Fleet, createFleetDto);
    const savedFleet = await queryRunner.manager.save(Fleet, fleet);

    const contact = queryRunner.manager.create(FleetContact, {
      fleetUid: fullFleetUid,
      encryptedEmail: finalEmail,
      contactEmail: finalEmail,
      encryptedPhone: phoneNumber,
      contactPhone: phoneNumber,
    });
    await queryRunner.manager.save(FleetContact, contact);

    let workTypeTiming = {};
    if (workTypeData) {
      workTypeTiming = {
        work_type_uid: workTypeData.work_type_uid,
        start_time: workTypeData.start_time,
        end_time: workTypeData.end_time,
        break_start_time: workTypeData.break_start_time,
        break_end_time: workTypeData.break_end_time,
      };
    }

    const profile = queryRunner.manager.create(FleetProfile, {
      fleetUid: fullFleetUid,
      first_name: firstName,
      last_name: lastName,
      dob,
      referral_code: referral_code ? referral_code : 'self',
      photo: Array.isArray(photo) ? photo : photo ? [photo] : [],
      ...workTypeTiming,
    });
    await queryRunner.manager.save(FleetProfile, profile);

    const bankDetails = queryRunner.manager.create(FleetBankDetails, {
      fleet: savedFleet,
      fleetUid: fullFleetUid,
      bank_name: bank_details?.bank_name ?? '',
      account_number: bank_details?.account_number ?? '',
      ifsc_code: bank_details?.ifsc_code ?? '',
      account_type: bank_details?.account_type ?? '',
    });
    await queryRunner.manager.save(FleetBankDetails, bankDetails);

    const fleetAddress = queryRunner.manager.create(FleetAddress, {
      fleet: savedFleet,
      fleetUid: fullFleetUid,
      city: address?.city ?? '',
      state: address?.state ?? '',
      pincode: address?.pincode ?? '',
      land_mark: address?.land_mark ?? '',
      lat: address?.lat ?? 0,
      lng: address?.lng ?? 0,
    });
    await queryRunner.manager.save(FleetAddress, fleetAddress);

    if (emergencyContacts && emergencyContacts.length > 0) {
      for (const item of emergencyContacts) {
        const emergencyContact = queryRunner.manager.create(FleetEmergencyContact, {
          ...item,
          fleet: savedFleet,
          fleetUid: fullFleetUid,
        });
        await queryRunner.manager.save(FleetEmergencyContact, emergencyContact);
      }
    }

    if (documents) {
      const doc = queryRunner.manager.create(FleetDocument, {
        fleet: savedFleet,
        fleetUid: fullFleetUid,
        aadharNumber: documents.aadharNumber,
        licenseNumber: documents.licenseNumber,
        vehicle_type: documents.vehicle_type,
        registrationNumber: documents.registrationNumber,
        model: documents.model,
        vehicleColor: documents.vehicleColor,
        insuranceNo: documents.insuranceNo,
        engineNo: documents.engineNo,
        frameNo: documents.frameNo,
        file_insurance: normalizeFiles(documents.file_insurance),
        file_aadhar: normalizeFiles(documents.file_aadhar),
        file_pan: normalizeFiles(documents.file_pan),
        file_rc: normalizeFiles(documents.file_rc),
        file_other: normalizeFiles(documents.file_other),
      });
      await queryRunner.manager.save(FleetDocument, doc);
    }

    await queryRunner.commitTransaction();

    if (email && email.trim() !== '') {
      try {
        const verificationLink = await firebaseService.sendEmailVerification(
          finalEmail,
          process.env.EMAIL_VERIFICATION_REDIRECT_URL || 'https://www.zenzio.in/',
        );

        const htmlEmail = `
      <h2>Welcome to Zenzio Delivery Fleet</h2>
      <p>Please verify your email to activate your account:</p>

      <a href="${verificationLink}" 
         style="background:#1c7ed6;color:#fff;padding:10px 20px;
         text-decoration:none;border-radius:6px;font-size:16px;">
         Verify Email
      </a>

      <p>If the button does not work, click the link below:</p>
      <p>${verificationLink}</p>
    `;

        await mailService.sendMail(
          finalEmail,
          'Verify Your Zenzio Email',
          htmlEmail,
          'admin@zenzio.in',
        );
      } catch (emailError) {
        console.error('Email verification sending failed:', emailError);
      }
    }

    const payload = {
      uid: savedFleet.uid,
      userId: savedFleet.id,
      email: finalEmail,
      role: savedFleet.role,
    };

    const accessToken = jwtService.generateAccessToken(payload);
    const refreshToken = await jwtService.generateRefreshToken(payload);

    await sessionService.createFleetSession(savedFleet, refreshToken);

    const fullUser = await fleetRepository.findOne({
      where: { id: savedFleet.id },
      relations: [
        'contact',
        'address',
        'bank_details',
        'profile',
        'emergencyContacts',
        'documents',
        'profile.work_type',
      ],
    });

    try {
      await notificationService.notifyNewPartnerRegistered(`${firstName} ${lastName}`, finalEmail);
    } catch (err) {
      console.error('Failed to notify admin about new delivery partner:', err);
    }

    return {
      user: fullUser,
      tokens: { accessToken, refreshToken },
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();

    try {
      if (firebaseAccount?.uid) {
        await deps.firebaseService.deleteUserIfUnused(firebaseAccount.uid);
      }
    } catch (deleteError) {
      console.error('Failed to cleanup Firebase account after DB error:', deleteError);
    }

    if (error instanceof BadRequestException) {
      throw error;
    }

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred during registration';
    throw new InternalServerErrorException({
      statusCode: 500,
      message: 'Registration failed',
      details: [errorMessage],
      error: 'InternalServerErrorException',
    });
  } finally {
    await queryRunner.release();
  }
}
