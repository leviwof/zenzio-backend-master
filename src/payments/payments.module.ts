import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RazorpayService } from './razorpay.service';
import { RazorpayController } from './razorpay.controller';
import { CartGroup } from '../cart/entity/cart-group.entity';
import { Order } from '../orders/order.entity';
import { NotificationModule } from '../notifications/notification.module';
import { CouponsModule } from 'src/coupons/coupons.module';

// Admin Payout Entities
import { FleetProfile } from '../fleet-v2/entity/fleet_profile.entity';
import { FleetBankDetails } from '../fleet-v2/entity/fleet_bank_details.entity';
import { RestaurantProfile } from '../restaurants/entity/restaurant_profile.entity';
import { RestaurantBankDetails } from '../restaurants/entity/restaurant_bank_details.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CartGroup, 
      Order, 
      FleetProfile, 
      FleetBankDetails, 
      RestaurantProfile, 
      RestaurantBankDetails
    ]), 
    forwardRef(() => NotificationModule),
    CouponsModule,
  ],
  controllers: [RazorpayController],
  providers: [RazorpayService],
  exports: [RazorpayService],
})
export class PaymentsModule {}
