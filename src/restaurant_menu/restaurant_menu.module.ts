import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant_menuController } from './restaurant_menu.controller';
import { RestaurantMenuService } from './restaurant_menu.service';
import { RestaurantMenu } from './restaurant_menu.entity';
import { RestaurantEnumController } from './restaurant_enum.controller';
import { RestaurantEnumService } from './restaurant_enum.service';
import { RestaurantEnum } from './restaurant_enum.entity';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { RestaurantProfile } from 'src/restaurants/entity/restaurant_profile.entity';
import { FileService } from 'src/file/file.service';
import { S3Module } from 'src/aws/s3.module';
import { MFileService } from './menu-images.service';
// import { S3Util } from 'src/aws/s3.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([RestaurantMenu, RestaurantEnum, Restaurant, RestaurantProfile]),
    S3Module, // <--- FIX
  ],
  controllers: [Restaurant_menuController, RestaurantEnumController],
  providers: [
    RestaurantMenuService,
    RestaurantEnumService,
    JwtServiceShared,
    FileService,
    MFileService,
  ],
})
export class RestaurantMenuModule {}
