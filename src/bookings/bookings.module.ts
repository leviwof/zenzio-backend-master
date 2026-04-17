import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { DiningSpace } from './entities/dining-space.entity';
import { DiningSpaceController } from './dining-spaces.controller';
import { DiningSpaceService } from './dining-spaces.service';
import { S3Module } from '../aws/s3.module';
import { AuthModule } from '../auth/auth.module';
import { Restaurant } from '../restaurants/entity/restaurant.entity';
import { Event } from '../events/entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, DiningSpace, Restaurant, Event]),
    S3Module,
    AuthModule,
  ],
  controllers: [BookingsController, DiningSpaceController],
  providers: [BookingsService, DiningSpaceService],
  exports: [BookingsService, DiningSpaceService],
})
export class BookingsModule {}
