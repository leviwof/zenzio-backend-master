import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { FcmToken } from './fcm-token.entity';
import { User } from '../users/user.entity';
import { Notification } from './notification.entity';
import { CommonModule } from 'src/shared/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FcmToken, User, Notification]),
    forwardRef(() => CommonModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
