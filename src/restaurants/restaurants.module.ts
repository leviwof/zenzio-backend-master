import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { Restaurant } from './entity/restaurant.entity';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { RestaurantContact } from './entity/restaurant_contact.entity';
import { SessionService } from 'src/auth/session.service';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { Session } from 'src/auth/session.entity';
import { RestaurantProfile } from './entity/restaurant_profile.entity';
import { RestaurantAddress } from './entity/restaurnat_address.entity';
import { RestaurantBankDetails } from './entity/restaurant_bank_details.entity';
import { UtilService } from 'src/utils/util.service';
import { RestaurantDocument } from './entity/restaurant_document.entity';
import { OperationalHour } from './entity/operational_hour.entity';
import { OtpService } from 'src/otp/otp.service';
import { OtpEntity } from 'src/otp/otp.entity';
import { SmsService } from 'src/otp/sms.service';
import { S3Module } from 'src/aws/s3.module';
import { RFileService } from './res-images.service';
import { FileService } from 'src/file/file.service';
import { DocumentUploadService } from './document-upload.service';
import { ForgotPasswordController } from './forgot-password.controller';
import { MailService } from 'src/mail/mail.service';

import { NotificationModule } from 'src/notifications/notification.module';
import { CartGroup } from 'src/cart/entity/cart-group.entity';
import { Booking } from 'src/bookings/entities/booking.entity';

import { Offer } from 'src/offers/offers.entity';
import { Order } from 'src/orders/order.entity';
import { RestaurantMenu } from 'src/restaurant_menu/restaurant_menu.entity';
import { Event } from 'src/events/entities/event.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import { DiningSpace } from 'src/bookings/entities/dining-space.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      RestaurantContact,
      OperationalHour,
      Session,
      RestaurantProfile,
      RestaurantAddress,
      RestaurantBankDetails,
      RestaurantDocument,
      OtpEntity,
      CartGroup,
      Booking,

      Offer,
      Order,
      RestaurantMenu,
      Event,
      Subscription,
      DiningSpace,
    ]),
    forwardRef(() => FirebaseModule),
    S3Module,
    NotificationModule,
  ],
  controllers: [RestaurantsController, ForgotPasswordController],
  providers: [
    RestaurantsService,
    SessionService,
    JwtServiceShared,
    UtilService,
    OtpService,
    SmsService,
    RFileService,
    FileService,
    DocumentUploadService,
    MailService,
  ],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
