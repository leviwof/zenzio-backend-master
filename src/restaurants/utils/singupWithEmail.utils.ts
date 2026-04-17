import { BadRequestException } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { CreateRestaurantDto } from '../dto/createRestaurant.dto';
import { Restaurant } from '../entity/restaurant.entity';
import { RestaurantContact } from '../entity/restaurant_contact.entity';
import { RestaurantProfile } from '../entity/restaurant_profile.entity';
import { RestaurantBankDetails } from '../entity/restaurant_bank_details.entity';
import { RestaurantAddress } from '../entity/restaurnat_address.entity';
import { FirebaseService } from 'src/firebase/firebase.service';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { SessionService } from 'src/auth/session.service';
import { UtilService } from 'src/utils/util.service';
import { Roles, ProviderType } from 'src/constants/app.enums';
import { RegisterRestaurantDto } from '../dto/registerRestaurnat.dto';
import { OperationalHour } from '../entity/operational_hour.entity';
import { RestaurantDocument } from '../entity/restaurant_document.entity';
import { MailService } from 'src/mail/mail.service';
import { NotificationService } from 'src/notifications/notification.service';

interface SignupWithEmailDeps {
  restaurantRepository: Repository<Restaurant>;
  restaurantContactRepository: Repository<RestaurantContact>;
  restaurantProfileRepository: Repository<RestaurantProfile>;
  restaurantBankDetailsRepository: Repository<RestaurantBankDetails>;
  restaurantAddressRepository: Repository<RestaurantAddress>;
  restaurantDocsRepo: Repository<RestaurantDocument>;
  operationalHourRepository: Repository<OperationalHour>;
  firebaseService: FirebaseService;
  jwtService: JwtServiceShared;
  sessionService: SessionService;
  utilService: UtilService;
  mailService: MailService;
  notificationService: NotificationService;
}

export async function signupWithEmail(
  registerUserDto: RegisterRestaurantDto,
  deps: SignupWithEmailDeps,
) {
  const {
    restaurantRepository,
    restaurantContactRepository,
    restaurantProfileRepository,
    restaurantBankDetailsRepository,
    restaurantAddressRepository,
    operationalHourRepository,
    firebaseService,
    jwtService,
    sessionService,
    utilService,
    mailService,
    restaurantDocsRepo,
    notificationService,
  } = deps;

  const {
    restaurant_name,
    contact_person,
    contact_number,
    contact_email,
    avg_cost_for_two,
    packing_charge,
    photo,
    email,
    phoneNumber,
    password,
    bank_details,
    address,
    operational_hours,
  } = registerUserDto;

  const existingContact = await restaurantContactRepository.findOne({
    where: [{ encryptedEmail: email }, { encryptedPhone: phoneNumber }],
  });

  if (existingContact) {
    throw new BadRequestException('Restaurant email or phone number already exists.');
  }

  const firebaseAccount = await firebaseService.registerUser(
    restaurant_name,
    contact_person,
    email,
    password,
  );

  const uid = await utilService.generateUniqueUid(async (generatedUid) => {
    const exists = await restaurantRepository.findOne({ where: { uid: generatedUid } });
    return !!exists;
  });

  const restaurantUid = uid + 'RES';

  const defaultOperationalHours = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
    day,
    enabled: true,
    from: '21:00',
    to: '23:00',
    restaurantUid,
  }));

  const finalOperationalHours = operational_hours?.length
    ? operational_hours.map((hr) => ({ ...hr, restaurantUid }))
    : defaultOperationalHours;

  const createRestaurantDto: CreateRestaurantDto = {
    uid: restaurantUid,
    firebase_uid: firebaseAccount.uid,
    restaurant_name,
    contact_person,
    avg_cost_for_two,
    contact_number,
    photo: Array.isArray(photo) ? photo : [],
    role: Roles.USER_RESTAURANT,
    providerType: ProviderType.PASSWORD,
    operational_hours: finalOperationalHours,
  };

  const restaurant = restaurantRepository.create(createRestaurantDto);
  const savedRestaurant = await restaurantRepository.save(restaurant);

  await restaurantContactRepository.save(
    restaurantContactRepository.create({
      restaurantUid,
      encryptedEmail: email,
      encryptedPhone: phoneNumber,
    }),
  );

  await restaurantProfileRepository.save(
    restaurantProfileRepository.create({
      restaurantUid,
      restaurant_name,
      contact_number,
      contact_email,
      contact_person,
      avg_cost_for_two,
      packing_charge: packing_charge ?? 0,
      photo: Array.isArray(photo) ? photo : [],
    }),
  );

  await restaurantBankDetailsRepository.save(
    restaurantBankDetailsRepository.create({
      restaurantUid,
      restaurant: savedRestaurant,
      bank_name: bank_details?.bank_name ?? '',
      account_number: bank_details?.account_number ?? '',
      ifsc_code: bank_details?.ifsc_code ?? '',
      account_type: bank_details?.account_type ?? '',
    }),
  );

  await restaurantAddressRepository.save(
    restaurantAddressRepository.create({
      restaurantUid,
      restaurant: savedRestaurant,
      city: address?.city ?? '',
      state: address?.state ?? '',
      pincode: address?.pincode ?? '',
      address: address?.address ?? '',
      land_mark: address?.land_mark ?? '',
      lat: address?.lat ?? 0,
      lng: address?.lng ?? 0,
    }),
  );

  const docs = registerUserDto.documents;

  const normalizedDocs: DeepPartial<RestaurantDocument> = {
    restaurantUid,
    restaurant: savedRestaurant,

    fssai_number: docs?.fssai_number ?? '',
    file_fssai: Array.isArray(docs?.file_fssai) ? docs.file_fssai : [],

    gst_number: docs?.gst_number ?? '',
    file_gst: Array.isArray(docs?.file_gst) ? docs.file_gst : [],

    trade_license_number: docs?.trade_license_number ?? '',
    file_trade_license: Array.isArray(docs?.file_trade_license) ? docs.file_trade_license : [],

    otherDocumentType: docs?.otherDocumentType ?? '',
    file_other_doc: Array.isArray(docs?.file_other_doc) ? docs.file_other_doc : [],
  };

  await restaurantDocsRepo.save(restaurantDocsRepo.create(normalizedDocs));

  await Promise.all(
    finalOperationalHours.map((hr) =>
      operationalHourRepository.save(
        operationalHourRepository.create({
          ...hr,
          restaurantUid,
          restaurant: savedRestaurant,
        }),
      ),
    ),
  );

  const verifyLink = await firebaseService.sendEmailVerification(
    email,
    process.env.EMAIL_VERIFICATION_REDIRECT_URL || 'https://zenzio.in',
  );

  const html = `
      <h2>Welcome to Zenzio Restaurant Partner</h2>
      <p>Verify your email to activate your restaurant dashboard.</p>

      <a href="${verifyLink}"
         style="background:#1c7ed6;color:#fff;padding:10px 18px;
         border-radius:8px;text-decoration:none;margin-top:20px;">
         Verify Email
      </a>

      <p>If the button doesn’t work, use the link below:</p>
      <p>${verifyLink}</p>
  `;

  await mailService.sendMail(email, 'Verify Your Restaurant Email', html);

  const payload = {
    uid: savedRestaurant.uid,
    userId: savedRestaurant.id,
    email,
    role: savedRestaurant.role,
    flags: savedRestaurant.verificationFlags,
  };

  const accessToken = jwtService.generateAccessToken(payload);
  const refreshToken = await jwtService.generateRefreshToken(payload);

  await sessionService.createRestaurantSession(savedRestaurant, refreshToken);

  const fullRestaurant = await restaurantRepository.findOne({
    where: { id: savedRestaurant.id },
    relations: ['contact', 'profile', 'bank_details', 'address', 'operational_hours', 'documents'],
  });

  try {
    await notificationService.notifyNewRestaurantRegistered(restaurant_name, email);
  } catch (err) {
    console.error('Failed to notify admin about new restaurant:', err);
  }

  return {
    user: fullRestaurant,
    tokens: {
      accessToken,
      refreshToken,
    },
  };
}
