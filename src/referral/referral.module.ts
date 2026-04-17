import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserReferral } from './referral.entity';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { User } from 'src/users/user.entity';
import { CouponsModule } from 'src/coupons/coupons.module';
import { Order } from 'src/orders/order.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserReferral, User, Order]), CouponsModule, AuthModule],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
