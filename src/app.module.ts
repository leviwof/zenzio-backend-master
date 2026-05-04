import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  OnModuleInit,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DbConfigModule } from './config/db-config.module';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';

import { VerificationClientMiddleware } from './middleware/verification-client-middleware';
import { AuthMeMiddleware } from './middleware/auth-me.middleware';
import { GlobalErrorModule } from './middleware/global-error.module';

import { EncryptionModule } from './encryption/encryption.module';
import { FirebaseModule } from './firebase/firebase.module';
import { CommonModule } from './shared/common.module';

import { UsersModule } from './users/users.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { SuperAdminService } from './super-admin/super-admin.service';
import { Argon2Service } from './shared/argon2.service';

import { RestaurantsModule } from './restaurants/restaurants.module';
import { RestaurantMenuModule } from './restaurant_menu/restaurant_menu.module';

import { FleetsModule } from './fleet-v2/fleets.module';
import { MapsModule } from './maps/maps.module';
import { CartModule } from './cart/cart.module';
import { FileModule } from './file/file.module';

import { PaymentsModule } from './payments/payments.module';
import { OtpModule } from './otp/otp.module';
import { RatingModule } from './rating/rating.module';
import { FoodRatingModule } from './rating/food-rating.module';
import { DeliveryLocationModule } from './delivery-location/delivery-location.module';
import { WorkTypeModule } from './work-type/work-type.module';
import { StatusModule } from './staus/status.module';
import { AttendanceModule } from './attendance/attendance.module';
import { MailModule } from './mail/mail.module';
import { EmergencyAlertModule } from './emergency-alert/emergency-alert.module';
import { OrdersModule } from './orders/orders.module';

import { TestController } from './test/test.controller';

import { Session } from './auth/session.entity';
import { SuperAdmin } from './super-admin/super-admin.entity';
import { EnumsModule } from './enums/enums.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { OffersModule } from './offers/offers.module';
import { NotificationModule } from './notifications/notification.module';
import { CouponsModule } from './coupons/coupons.module';
import { BookingsModule } from './bookings/bookings.module';
import { EventsModule } from './events/events.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SupportModule } from './support/support.module';
import { RedisModule } from './redis/redis.module';
import { BannersModule } from './banners/banners.module';
import { Banner } from './banners/banner.entity';
import { GlobalSettingsModule } from './global-settings/global-settings.module';
import { ReferralModule } from './referral/referral.module';
import { HealthModule } from './health/health.module';
import { CategoriesController } from './categories/categories.controller';

@Module({
  imports: [
    // Rate limiting - prevent brute force and DDoS attacks
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutes
        limit: 1000, // 1000 requests per 15 minutes
      },
    ]),

    MailModule,
    AppConfigModule,
    CommonModule,
    DbConfigModule,
    EncryptionModule,
    FirebaseModule,


    EnumsModule,
    AuthModule,
    UsersModule,
    SuperAdminModule,
    RestaurantsModule,
    RestaurantMenuModule,
    MenuModule,
    FleetsModule,
    MapsModule,
    CartModule,
    PaymentsModule,
    OtpModule,
    FileModule,
    RatingModule,
    FoodRatingModule,
    DeliveryLocationModule,
    WorkTypeModule,
    StatusModule,
    AttendanceModule,
    EmergencyAlertModule,
    OrdersModule,
    OffersModule,
    NotificationModule,
    CouponsModule,
    BookingsModule,
    EventsModule,
    SubscriptionsModule,
    SupportModule,
    RedisModule,
    BannersModule,
    GlobalSettingsModule,
    ReferralModule,
    HealthModule,

    TypeOrmModule.forFeature([Session, SuperAdmin, Banner]),


    GlobalErrorModule.forRoot(),
  ],
  controllers: [AppController, TestController, CategoriesController],
  providers: [
    AppService,
    VerificationClientMiddleware,
    SuperAdminService,
    Argon2Service,
    AppConfigService,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [AppConfigService],
})
export class AppModule implements NestModule, OnModuleInit {
  constructor(private readonly superAdminService: SuperAdminService) { }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerificationClientMiddleware)
      .exclude(
        { path: '/', method: RequestMethod.ALL },
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/live', method: RequestMethod.ALL },
        { path: '/status-codes', method: RequestMethod.ALL },
        { path: 'test-email', method: RequestMethod.ALL },
      )
      .forRoutes('*');

    consumer
      .apply(AuthMeMiddleware)
      .exclude({ path: 'super-admin/profile', method: RequestMethod.POST })
      .forRoutes('*');
  }

  onModuleInit() {
    this.superAdminService.initSuperAdmin();
  }
}
