import { forwardRef, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
// import { FirebaseAdminService } from './firebase-admin';
import { FirebaseController } from './firebase.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { Fleet } from 'src/fleet-v2/entity/fleet.entity';

import { UsersModule } from 'src/users/users.module';
import { RestaurantsModule } from 'src/restaurants/restaurants.module';
import { MailModule } from 'src/mail/mail.module';
// import { SharedModule } from 'src/shared/shared.module'; // contains JwtServiceShared & UtilService
import { UtilService } from 'src/utils/util.service';
import { JwtServiceShared } from 'src/shared/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Restaurant, Fleet]),

    // Circular references
    forwardRef(() => UsersModule),
    forwardRef(() => RestaurantsModule),

    // External services
    MailModule,
    // SharedModule,
    MailModule,
  ],

  controllers: [FirebaseController],

  providers: [FirebaseService, UtilService, JwtServiceShared],

  exports: [FirebaseService],
})
export class FirebaseModule {}
