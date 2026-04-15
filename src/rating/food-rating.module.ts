import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodRating } from './food-rating.entity';
import { FoodRatingService } from './food-rating.service';
import { FoodRatingController } from './food-rating.controller';
import { JwtServiceShared } from 'src/shared/jwt.service';

@Module({
  imports: [TypeOrmModule.forFeature([FoodRating])],
  controllers: [FoodRatingController],
  providers: [FoodRatingService, JwtServiceShared],
})
export class FoodRatingModule {}
