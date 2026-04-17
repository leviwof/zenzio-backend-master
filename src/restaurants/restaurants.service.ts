import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Query,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateRestaurantDto } from './dto/createRestaurant.dto';
import { Restaurant } from './entity/restaurant.entity';
import { RegisterRestaurantDto } from './dto/registerRestaurnat.dto';
import { RestaurantLoginEmailDto, RestaurantLoginOtpDto } from './dto/login.dto';

import { FirebaseService } from 'src/firebase/firebase.service';
import { RestaurantContact } from './entity/restaurant_contact.entity';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { SessionService } from 'src/auth/session.service';
import { Roles } from 'src/constants/app.enums';

import { RestaurantBankDetails } from './entity/restaurant_bank_details.entity';
import { RestaurantAddress } from './entity/restaurnat_address.entity';
import { UtilService } from 'src/utils/util.service';
import { RestaurantProfile } from './entity/restaurant_profile.entity';
import { RestaurantDocument } from './entity/restaurant_document.entity';
import { signupWithEmail } from './utils/singupWithEmail.utils';

import { NearestActiveRestaurantResult } from './utils/restaurant.types';
import { buildNearestActiveRestaurantsQuery } from './utils/nearest-restaurant.utils';
import { toggleRestaurantActiveUtil } from './utils/toggle-active.util';

import { OtpEntity } from 'src/otp/otp.entity';
import { OperationalHour } from './entity/operational_hour.entity';
import { MailService } from 'src/mail/mail.service';

import { UpdateRestaurantProfileDto } from './dto/restaurant-profile.dto';
import { UpdateRestaurantDocumentDto } from './dto/update-restaurant-document.dto';
import { OperationalHourDto } from './dto/operational-hour.dto';
import { UpdateRestaurantAddressDto } from './dto/update-restaurant-address.dto';
import { UpdateBankDetailsDto } from './dto/update-bank-details.dto';
import { statusRestaurantByAdminUtil } from './utils/toggle-active-admin.util';
import { NotificationService } from 'src/notifications/notification.service';
import { CartGroup } from 'src/cart/entity/cart-group.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Offer } from 'src/offers/offers.entity';
import { Order } from 'src/orders/order.entity';
import { RestaurantMenu } from 'src/restaurant_menu/restaurant_menu.entity';
import { CartOrderStatus } from 'src/constants/status.constants';
import { Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Event } from 'src/events/entities/event.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { DiningSpace } from 'src/bookings/entities/dining-space.entity';
import { Session } from 'src/auth/session.entity';

@Injectable()
export class RestaurantsService implements OnModuleInit {
  constructor(
    @InjectRepository(OtpEntity)
    private readonly otpRepository: Repository<OtpEntity>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,

    @InjectRepository(RestaurantContact)
    private readonly restaurantContactRepository: Repository<RestaurantContact>,

    @InjectRepository(RestaurantAddress)
    private readonly restaurantAddressRepository: Repository<RestaurantAddress>,

    @InjectRepository(RestaurantProfile)
    private readonly restaurantProfileRepository: Repository<RestaurantProfile>,

    @InjectRepository(RestaurantDocument)
    private readonly restaurantDocsRepo: Repository<RestaurantDocument>,

    @InjectRepository(OperationalHour)
    private readonly operationalHourRepository: Repository<OperationalHour>,

    @InjectRepository(RestaurantBankDetails)
    private readonly restaurantBankDetailsRepository: Repository<RestaurantBankDetails>,

    private readonly firebaseService: FirebaseService,
    private readonly jwtService: JwtServiceShared,
    private readonly sessionService: SessionService,
    private readonly utilService: UtilService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,

    @InjectRepository(CartGroup)
    private readonly cartGroupRepo: Repository<CartGroup>,

    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,

    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,

    @InjectRepository(RestaurantMenu)
    private readonly menuRepo: Repository<RestaurantMenu>,
  ) {}

  private normalizeRestaurantPhoto(photo: string): string {
    if (!photo || photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }

    const bucket = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) {
      return photo;
    }

    return `https://${bucket}.s3.${region}.amazonaws.com/images/restaurant/${photo}`;
  }

  private normalizeRestaurantPhotos(photos?: string[] | null): string[] {
    if (!Array.isArray(photos)) {
      return [];
    }

    return photos
      .filter((photo): photo is string => typeof photo === 'string' && photo.length > 0)
      .map((photo) => this.normalizeRestaurantPhoto(photo));
  }

  async onModuleInit() {
    await this.migrateDeliveryRadius();
    await this.migrateDiningColumns();
    await this.cleanupAllProfiles();
  }

  /**
   * Add dining columns if they don't exist (one-time migration)
   */
  private async migrateDiningColumns() {
    try {
      const queryRunner = this.restaurantRepository.manager.connection.createQueryRunner();

      const columns = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'restaurants';
      `);
      console.log(
        '🔍 Columns in restaurants table:',
        columns.map((c) => c.column_name),
      );

      console.log('🔧 Checking dining columns in restaurants table...');
      await queryRunner.query(`
        ALTER TABLE restaurants 
        ADD COLUMN IF NOT EXISTS "isDiningEnabled" boolean DEFAULT true;
      `);

      console.log('✅ Dining columns synced successfully');

      await queryRunner.release();
    } catch (error) {
      console.error('❌ Error migrating dining columns:', error);
    }
  }

  /**
   * Add deliveryRadius column if it doesn't exist (one-time migration)
   */
  private async migrateDeliveryRadius() {
    try {
      const queryRunner = this.restaurantRepository.manager.connection.createQueryRunner();
      const hasColumn = await queryRunner.hasColumn('restaurants', 'deliveryRadius');

      if (!hasColumn) {
        console.log('🔧 Adding deliveryRadius column to restaurants table...');
        await queryRunner.query(`
          ALTER TABLE restaurants 
          ADD COLUMN IF NOT EXISTS "deliveryRadius" DECIMAL(5,2) DEFAULT 5.0
        `);
        console.log('✅ deliveryRadius column added successfully');
      } else {
        console.log('✅ deliveryRadius column already exists');
      }

      await queryRunner.release();
    } catch (error) {
      console.error('❌ Error migrating deliveryRadius column:', error);
    }
  }

  async create(createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
    const user = this.restaurantRepository.create(createRestaurantDto);
    return await this.restaurantRepository.save(user);
  }

  async signupWithEmail(registerUserDto: RegisterRestaurantDto) {
    return await signupWithEmail(registerUserDto, {
      restaurantRepository: this.restaurantRepository,
      restaurantContactRepository: this.restaurantContactRepository,
      restaurantProfileRepository: this.restaurantProfileRepository,
      restaurantBankDetailsRepository: this.restaurantBankDetailsRepository,
      restaurantAddressRepository: this.restaurantAddressRepository,
      restaurantDocsRepo: this.restaurantDocsRepo,
      operationalHourRepository: this.operationalHourRepository,
      firebaseService: this.firebaseService,
      jwtService: this.jwtService,
      sessionService: this.sessionService,
      mailService: this.mailService,
      utilService: this.utilService,
      notificationService: this.notificationService,
    });
  }

  async loginwithOtp(payload: RestaurantLoginOtpDto) {
    const { phone, otp } = payload;

    const contact = await this.restaurantContactRepository.findOne({
      where: { encryptedPhone: phone },
    });

    if (!contact) {
      throw new UnauthorizedException('Invalid contact');
    }

    const restaurant = await this.restaurantRepository.findOne({
      where: { uid: contact.restaurantUid },
    });

    if (!restaurant) {
      throw new UnauthorizedException('Restaurant not found');
    }

    if (!restaurant.isActive) {
      throw new UnauthorizedException('Restaurant has been blocked');
    }

    const plainPhone = contact.encryptedPhone;

    const record = await this.otpRepository.findOne({
      where: { phone: plainPhone, isVerified: false },
      order: { createdAt: 'DESC' },
    });

    if (!record) throw new UnauthorizedException('Invalid user or Otp');
    if (new Date() > record.expiresAt) throw new UnauthorizedException('OTP expired');
    if (record.otp !== otp) throw new UnauthorizedException('Invalid OTP');

    record.isVerified = true;
    await this.otpRepository.save(record);

    const userInDb = await this.restaurantRepository.findOne({
      where: { uid: contact.restaurantUid },
      relations: ['contact', 'bank_details', 'address'],
    });

    if (!userInDb) throw new UnauthorizedException('Restaurant not registered');

    const payloadJwt = {
      uid: userInDb.uid,
      userId: userInDb.id,
      role: userInDb.role,
      firebase_uid: userInDb.firebase_uid,
    };

    const accessToken = this.jwtService.generateAccessToken(payloadJwt);
    const refreshToken = await this.jwtService.generateRefreshToken(payloadJwt);

    await this.sessionService.createRestaurantSession(userInDb, refreshToken);

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

  async loginWithEmail(payload: RestaurantLoginEmailDto) {
    const userType = Roles.USER_RESTAURANT;
    const { email, password } = payload;

    type FirebaseLoginResponse = {
      user?: { firebase_uid: string; [key: string]: any };
      [key: string]: any;
    };

    const firebaseResponse = (await this.firebaseService.loginUser(
      email,
      password,
      userType,
    )) as FirebaseLoginResponse;

    if (!('user' in firebaseResponse) || !firebaseResponse.user) {
      return firebaseResponse;
    }

    const userInDb = await this.restaurantRepository.findOne({
      where: {
        firebase_uid: firebaseResponse.user.firebase_uid,
        role: userType,
      },
      relations: ['contact', 'bank_details', 'address'],
    });

    if (!userInDb) {
      throw new UnauthorizedException('Restaurant not registered');
    }

    if (!userInDb.isActive) {
      throw new UnauthorizedException('Restaurant has been blocked');
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

    await this.sessionService.createRestaurantSession(userInDb, refreshToken);

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

  async getMyProfile(uid: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { uid },
      relations: [
        'contact',
        'bank_details',
        'address',
        'profile',
        'documents',
        'operational_hours',
      ],
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with uid=${uid} not found`);
    }

    if (restaurant.profile) {
      restaurant.profile.photo = this.normalizeRestaurantPhotos(restaurant.profile.photo);
    }

    return restaurant;
  }

  async findByUidPublic(uid: string) {
    const user = await this.restaurantRepository.findOne({
      where: { uid },
      relations: [
        'contact',
        'bank_details',
        'address',
        'profile',
        'documents',
        'operational_hours',
      ],
    });

    if (!user) {
      throw new NotFoundException(`Restaurant with uid=${uid} not found`);
    }

    if (user.profile) {
      user.profile.photo = this.normalizeRestaurantPhotos(user.profile.photo);
    }

    // Compute GST status from documents, then strip documents from public response
    const isGstRegistered = Boolean(user.documents?.[0]?.gst_number?.toString().trim());
    const { documents: _docs, ...publicData } = user;

    return { ...publicData, isGstRegistered };
  }

  async findByUidForAdmin(uid: string): Promise<Restaurant> {
    const user = await this.restaurantRepository.findOne({
      where: { uid },
      relations: [
        'contact',
        'bank_details',
        'address',
        'profile',
        'documents',
        'operational_hours',
      ],
    });

    if (!user) {
      throw new NotFoundException(`Restaurant with uid=${uid} not found`);
    }

    if (user.profile) {
      user.profile.photo = this.normalizeRestaurantPhotos(user.profile.photo);
    }

    return user;
  }

  async refreshAuthToken(@Query('refreshToken') refreshToken: string) {
    return this.firebaseService.refreshAuthToken(refreshToken);
  }

  async findAll(): Promise<Restaurant[]> {
    const restaurants = await this.restaurantRepository.find({
      relations: ['profile'],
    });

    return restaurants.map((restaurant) => {
      if (restaurant.profile) {
        restaurant.profile.photo = this.normalizeRestaurantPhotos(restaurant.profile.photo);
      }

      return restaurant;
    });
  }

  async findOne(id: string): Promise<Restaurant> {
    const user = await this.restaurantRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }
    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.restaurantRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }
  }

  async toggleRestaurantActive(uid: string) {
    return toggleRestaurantActiveUtil(this.restaurantRepository, uid);
  }

  async statusRestaurantByAdmin(
    admin_uid: string,
    restaurant_uid: string,
    body: { status?: boolean; isActive?: boolean },
  ) {
    return statusRestaurantByAdminUtil(this.restaurantRepository, restaurant_uid, body);
  }

  async updateProfile(restaurantUid: string, dto: UpdateRestaurantProfileDto) {
    console.log('🔧 updateProfile called for:', restaurantUid);
    console.log('🔧 DTO received:', JSON.stringify(dto));

    const profile = await this.restaurantProfileRepository.findOne({
      where: { restaurantUid },
    });

    if (!profile) {
      throw new NotFoundException('Restaurant profile not found');
    }

    const { deliveryRadius, ...profileFields } = dto;

    if (profileFields.photo && Array.isArray(profileFields.photo)) {
      const originalCount = profileFields.photo.length;
      profileFields.photo = profileFields.photo.filter(
        (p) => !p.startsWith('/') && !p.includes('/data/') && !p.includes('/cache/'),
      );
      if (profileFields.photo.length !== originalCount) {
        console.warn(
          `🛡️ Rejected ${originalCount - profileFields.photo.length} local paths from profile update`,
        );
      }
    }

    console.log('🔧 Profile fields to update:', JSON.stringify(profileFields));
    console.log('🔧 DeliveryRadius to update:', deliveryRadius);

    Object.assign(profile, profileFields);
    await this.restaurantProfileRepository.save(profile);

    await this.cleanupAllProfiles();

    if (deliveryRadius !== undefined) {
      console.log('🔧 Updating deliveryRadius in Restaurant entity...');
      const restaurant = await this.restaurantRepository.findOne({
        where: { uid: restaurantUid },
      });
      if (restaurant) {
        restaurant.deliveryRadius = deliveryRadius;
        await this.restaurantRepository.save(restaurant);
        console.log('✅ DeliveryRadius updated to:', deliveryRadius);
      } else {
        console.log('❌ Restaurant not found for deliveryRadius update');
      }
    }

    return { success: true, message: 'Profile updated successfully' };
  }

  async updateOperationalHours(restaurantUid: string, hours: OperationalHourDto[]) {
    console.log('📅 Updating operational hours for:', restaurantUid);
    console.log('📅 Hours received:', JSON.stringify(hours));

    if (!hours || !Array.isArray(hours)) {
      throw new BadRequestException('operationalHours must be an array');
    }

    const restaurant = await this.restaurantRepository.findOne({
      where: { uid: restaurantUid },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    await this.operationalHourRepository.delete({ restaurantUid });

    const newHours = hours.map((h) =>
      this.operationalHourRepository.create({
        ...h,
        restaurantUid,
      }),
    );

    await this.operationalHourRepository.save(newHours);

    return {
      status: 'success',
      message: 'Operational hours updated',
      operationalHours: newHours,
    };
  }

  async getProfile(restaurantUid: string) {
    const profile = await this.restaurantProfileRepository.findOne({
      where: { restaurantUid },
    });

    if (!profile) {
      throw new NotFoundException('Restaurant profile not found');
    }

    profile.photo = this.normalizeRestaurantPhotos(profile.photo);

    return profile;
  }

  async updateAddress(restaurantUid: string, dto: UpdateRestaurantAddressDto) {
    const address = await this.restaurantAddressRepository.findOne({
      where: { restaurantUid },
    });

    if (!address) {
      throw new NotFoundException('Restaurant address not found');
    }

    Object.assign(address, dto);

    return await this.restaurantAddressRepository.save(address);
  }

  async updateDocumentsByUid(restaurantUid: string, dto: UpdateRestaurantDocumentDto) {
    let documents = await this.restaurantDocsRepo.findOne({
      where: { restaurantUid },
    });

    if (!documents) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { uid: restaurantUid },
      });
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }
      documents = await this.restaurantDocsRepo.save({
        restaurantUid,
        restaurant,
      });
    }

    const { file_fssai, file_gst, file_trade_license, file_other_doc, ...docNumbers } = dto;

    Object.assign(documents, docNumbers);

    if (file_fssai !== undefined) documents.file_fssai = file_fssai;
    if (file_gst !== undefined) documents.file_gst = file_gst;
    if (file_trade_license !== undefined) documents.file_trade_license = file_trade_license;
    if (file_other_doc !== undefined) documents.file_other_doc = file_other_doc;

    return await this.restaurantDocsRepo.save(documents);
  }

  async updateBankDetails(restaurantUid: string, dto: UpdateBankDetailsDto) {
    const record = await this.restaurantBankDetailsRepository.findOne({
      where: { restaurantUid },
    });

    if (!record) {
      throw new NotFoundException('Bank details not found');
    }

    Object.assign(record, dto);

    // Automatically reset Razorpay safety flags if bank info changes
    record.verified = false;
    record.razorpay_accid = null as unknown as string;

    return await this.restaurantBankDetailsRepository.save(record);
  }

  async getNearestActiveRestaurants(
    userLat: number,
    userLng: number,
    radiusKm = 10,
    page = 1,
    limit = 10,
    search?: string,
    filter: string = 'all',
    sort?: string,
    order: string = 'asc',
  ): Promise<[NearestActiveRestaurantResult[], number]> {
    const sql = buildNearestActiveRestaurantsQuery(filter, sort, order, search);
    const skip = (page - 1) * limit;

    const queryParams: any[] = [userLat, userLng, radiusKm, limit, skip];

    if (search && search.trim().length > 0) {
      queryParams.push(`%${search.toLowerCase()}%`);
    }

    const raw: any[] = await this.restaurantRepository.query(sql, queryParams);

    const total = raw.length > 0 ? Number(raw[0].total_count) : 0;
    console.log({ rawLength: raw.length, total });

    const items: NearestActiveRestaurantResult[] = raw.map((r: any) => {
      const photo = this.normalizeRestaurantPhotos(
        Array.isArray(r.photo) ? (r.photo as unknown[]).map((p) => String(p)) : [],
      );

      return {
        restaurant_uid: String(r.restaurant_uid),
        restaurant_id: Number(r.restaurant_id),
        restaurant_name: r.restaurant_name ? String(r.restaurant_name) : null,
        isDiningEnabled: r.isDiningEnabled ?? false,
        isGstRegistered: Boolean(r.gst_number?.toString().trim()),
        lat: Number(r.lat),
        lng: Number(r.lng),
        distance: Number(r.distance),
        avg_cost_two: r.avg_cost_for_two ? String(r.avg_cost_for_two) : '0',
        rest_address: r.full_address ? String(r.full_address) : null,
        rest_logo: photo[0] ?? null,
        rating_avg: r.rating_avg ? Number(r.rating_avg) : 0,
        food_type: r.food_type ? String(r.food_type) : null,
        current_offers: Array.isArray(r.current_offers) ? r.current_offers : [],
        profile: {
          restaurant_name: r.restaurant_name ? String(r.restaurant_name) : null,
          contact_person: r.contact_person ? String(r.contact_person) : null,
          contact_number: r.contact_number ? String(r.contact_number) : null,
          avg_cost_for_two: r.avg_cost_for_two ? String(r.avg_cost_for_two) : null,
          packing_charge: r.packing_charge ? Number(r.packing_charge) : 0,
          food_type: r.food_type ? String(r.food_type) : null,
          contact_email: r.contact_email ? String(r.contact_email) : null,
          photo,
        },
      };
    });

    return [items, total];
  }

  /**
   * Change restaurant password
   */
  async changePassword(
    restaurantUid: string,
    dto: { current_password: string; new_password: string },
  ) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { uid: restaurantUid },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (!restaurant.firebase_uid) {
      throw new BadRequestException('Restaurant Firebase account not linked.');
    }

    // --- UPDATED: Use Firebase to verify old password and update to new password ---
    // Old argon2 approach (local DB only) was commented out:
    // const argon2 = await import('argon2');
    // const isPasswordValid = await argon2.verify(restaurant.password, dto.current_password);
    // const hashedPassword = await argon2.hash(dto.new_password);
    // restaurant.password = hashedPassword;
    // await this.restaurantRepository.save(restaurant);
    await this.firebaseService.changeUserPassword(
      restaurant.firebase_uid,
      dto.current_password,
      dto.new_password,
    );

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  /**
   * Reset restaurant password (no current password verification)
   * Used when user is already authenticated
   */
  async resetPassword(restaurantUid: string, dto: { new_password: string }) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { uid: restaurantUid },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Fetch the restaurant's email from the contact table
    const contact = await this.restaurantContactRepository.findOne({
      where: { restaurantUid },
    });

    if (!contact?.encryptedEmail) {
      throw new BadRequestException('Restaurant email not found.');
    }

    // --- UPDATED: Use Firebase to reset password directly ---
    // Old argon2 approach (local DB only) was commented out:
    // const argon2 = await import('argon2');
    // const hashedPassword = await argon2.hash(dto.new_password);
    // restaurant.password = hashedPassword;
    // await this.restaurantRepository.save(restaurant);
    await this.firebaseService.updatePasswordDirect(contact.encryptedEmail, dto.new_password);

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  async toggleDiningStatus(uid: string) {
    const restaurant = await this.restaurantRepository.findOne({ where: { uid } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    restaurant.isDiningEnabled = !restaurant.isDiningEnabled;
    return await this.restaurantRepository.save(restaurant);
  }

  async cleanupAllProfiles() {
    console.log('🛡️ Starting cleanup of local paths in all restaurant profiles...');
    const profiles = await this.restaurantProfileRepository.find();
    let cleanedCount = 0;

    for (const profile of profiles) {
      if (profile.photo && Array.isArray(profile.photo)) {
        const originalArray = [...profile.photo];
        profile.photo = profile.photo.filter(
          (p) => !p.startsWith('/') && !p.includes('/data/') && !p.includes('/cache/'),
        );

        if (profile.photo.length !== originalArray.length) {
          await this.restaurantProfileRepository.save(profile);
          cleanedCount++;
          console.log(`🛡️ Cleaned profile for restaurantUid: ${profile.restaurantUid}`);
        }
      }
    }
    console.log(`🛡️ Cleanup finished. Fixed ${cleanedCount} profiles.`);
  }

  /**
   * 🗑️ PERMANENTLY DELETE RESTAURANT
   */
  async permanentlyDeleteRestaurant(uid: string) {
    const restaurant = await this.restaurantRepository.findOne({ where: { uid } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const queryRunner = this.restaurantRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      await manager.delete(Order, { restaurant_uid: uid });
      console.log('✅ Orders deleted');

      await manager.delete(CartGroup, { restaurant_uid: uid });
      console.log('✅ CartGroups deleted');

      if (restaurant.id) {
        await manager.delete(Booking, { restaurant_id: restaurant.id });
        console.log('✅ Bookings deleted');
      }

      await manager.delete(Offer, { restaurantId: uid });
      console.log('✅ Offers deleted');

      await manager.delete(Event, { restaurant_id: uid });
      console.log('✅ Events deleted');

      if (restaurant.id) {
        await manager.delete(Subscription, { restaurant_id: restaurant.id });
        console.log('✅ Subscriptions deleted');
      }

      await manager.delete(DiningSpace, { restaurantId: uid });
      console.log('✅ DiningSpaces deleted');

      await manager.delete(RestaurantContact, { restaurantUid: uid });
      await manager.delete(RestaurantAddress, { restaurantUid: uid });
      await manager.delete(RestaurantProfile, { restaurantUid: uid });
      await manager.delete(RestaurantBankDetails, { restaurantUid: uid });
      await manager.delete(RestaurantDocument, { restaurantUid: uid });
      await manager.delete(OperationalHour, { restaurantUid: uid });
      await manager.delete(Session, { restaurantUid: uid });

      console.log('✅ Dependent tables deleted');

      await manager.delete(Restaurant, { uid });

      await queryRunner.commitTransaction();
      console.log('✅ Restaurant permanently deleted from DB');

      // --- NEW: Safe Firebase Deletion AFTER DB transaction is committed ---
      if (restaurant.firebase_uid) {
        await this.firebaseService.deleteUserIfUnused(restaurant.firebase_uid);
      }

      const response = {
        status: 'success',
        code: 200,
        message: 'Restaurant account has been permanently deleted',
        data: { success: true },
      };
      console.log('📤 Sending deletion response:', response);
      return response;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Database deletion failed:', err);
      throw new BadRequestException(`Failed to delete restaurant: ${(err as any).message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async getAdminStats(uid: string, startDate?: string, endDate?: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { uid },
      relations: ['profile'],
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    let start: Date, end: Date;

    console.log(`📊 fetching Admin Stats for UID: ${uid}`);
    console.log(`🏨 Restaurant Name: ${restaurant.profile?.restaurant_name}`);
    console.log(`📅 Input Dates -> Start: ${startDate}, End: ${endDate}`);

    if (startDate && endDate) {
      start = new Date(`${startDate}T00:00:00`);
      end = new Date(`${endDate}T23:59:59.999`);
    } else {
      const today = new Date();
      start = new Date(today);
      start.setHours(0, 0, 0, 0);

      end = new Date(today);
      end.setHours(23, 59, 59, 999);
    }
    console.log(`🕒 Query Range -> Start: ${start.toISOString()}, End: ${end.toISOString()}`);

    const salesResult = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.price)', 'total')
      .where('order.restaurant_uid = :uid', { uid })
      .andWhere('order.status = :status', { status: 'completed' })
      .andWhere('order.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    const totalSales = parseFloat(salesResult?.total || '0');

    const totalOrders = await this.orderRepo.count({
      where: {
        restaurant_uid: uid,
        status: 'completed',
        createdAt: Between(start, end),
      },
    });

    const bookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.restaurant_id = :resId', { resId: restaurant.id })
      .andWhere('booking.date BETWEEN :start AND :end', {
        start: startDate || start.toISOString().split('T')[0],
        end: endDate || end.toISOString().split('T')[0],
      })
      .getCount();

    const liveOffers = await this.offerRepo.count({
      where: {
        restaurantId: uid,
        startDate: LessThanOrEqual(end),
        endDate: MoreThanOrEqual(start),
        status: 'APPROVED',
      },
    });

    return {
      sales: totalSales,
      orders: totalOrders,
      bookings: bookings,
      active_offers: liveOffers,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  }

  async resendVerificationEmail(email: string) {
    const link = await this.firebaseService.sendEmailVerification(
      email,
      process.env.EMAIL_VERIFICATION_REDIRECT_URL || 'https://restaurant-app-kd2m.onrender.com',
    );

    return {
      success: true,
      message: 'Verification email sent successfully',
      link,
    };
  }
}
