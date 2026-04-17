import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartService } from './cart.service';
import { CartController } from './cart.controller';

import { CartGroup } from './entity/cart-group.entity';
import { Cart } from './entity/cart.entity';
import { CartItem } from './entity/cart-item.entity';

import { JwtServiceShared } from 'src/shared/jwt.service';
import { UtilService } from 'src/utils/util.service';
import { CartStatusController } from './cart-status.controller';
import { CartStatusService } from './cart-status.service';

import { DeliveryLocationModule } from 'src/delivery-location/delivery-location.module';
import { RestaurantOrderController } from './restaurant-order.controller';
import { RestaurantOrderService } from './restaurant-order.service';

import { FleetOrderService } from './fleet-order.service';
import { FleetOrderController } from './fleet-order.controller';
import { CartGroupService } from './cart-group.service';

import { Order } from 'src/orders/order.entity';
import { Fleet } from 'src/fleet-v2/entity/fleet.entity';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { RestaurantProfile } from 'src/restaurants/entity/restaurant_profile.entity';
import { RestaurantDocument } from 'src/restaurants/entity/restaurant_document.entity';
import { User } from 'src/users/user.entity';
import { DeliveryLocation } from 'src/delivery-location/delivery_location.entity';
import { PaymentsModule } from 'src/payments/payments.module';
import { NotificationModule } from 'src/notifications/notification.module';
import { CouponsModule } from 'src/coupons/coupons.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cart,
      CartGroup,
      CartItem,
      Order,
      Fleet,
      Restaurant,
      RestaurantProfile,
      RestaurantDocument,
      User,
      DeliveryLocation,
    ]),
    forwardRef(() => DeliveryLocationModule),
    PaymentsModule,
    NotificationModule,
    CouponsModule,
  ],
  controllers: [
    CartController,

    CartStatusController,
    RestaurantOrderController,
    FleetOrderController,
  ],
  providers: [
    CartService,

    JwtServiceShared,
    UtilService,
    CartStatusService,
    RestaurantOrderService,

    FleetOrderService,
    CartGroupService,
  ],
})
export class CartModule {}
