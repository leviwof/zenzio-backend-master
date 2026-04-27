import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { UtilService } from 'src/utils/util.service';
import { NotificationModule } from 'src/notifications/notification.module';

import { DeliveryHistory } from 'src/fleet-v2/entity/delivery_history.entity';
import { RestaurantProfile } from 'src/restaurants/entity/restaurant_profile.entity';
import { RestaurantDocument } from 'src/restaurants/entity/restaurant_document.entity';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';

import { RedisModule } from 'src/redis/redis.module';
import { FileModule } from 'src/file/file.module';
import { ReferralModule } from 'src/referral/referral.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, DeliveryHistory, RestaurantProfile, RestaurantDocument, Restaurant]),
    NotificationModule,
    RedisModule,
    FileModule,
    ReferralModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, JwtServiceShared, UtilService],
  exports: [OrdersService],
})
export class OrdersModule { }
