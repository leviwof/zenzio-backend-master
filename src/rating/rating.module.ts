import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './rating.entity';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';

import { Order } from '../orders/order.entity';
import { Restaurant } from '../restaurants/entity/restaurant.entity';
import { Fleet } from '../fleet-v2/entity/fleet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, Order, Restaurant, Fleet])],
  controllers: [RatingController],
  providers: [RatingService],
})
export class RatingModule {}
