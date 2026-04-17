import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { UserContact } from './user_contact.entity';
import { SessionService } from 'src/auth/session.service';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { Session } from 'src/auth/session.entity';
import { UserProfile } from './user_profile.entity';
import { UserAddress } from './user_address.entity';
import { BankDetails } from './bank_details.entity';
import { UtilService } from 'src/utils/util.service';
import { OtpEntity } from 'src/otp/otp.entity';
import { ForgotPasswordController } from './forgot-password.controller';
import { MailService } from 'src/mail/mail.service';
import { UFileService } from './user-images.service';
import { S3Util } from 'src/aws/s3.util';
import { ReferralModule } from 'src/referral/referral.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserContact,
      Session,
      UserProfile,
      UserAddress,
      BankDetails,
      OtpEntity,
    ]),
    forwardRef(() => FirebaseModule),
    ReferralModule,
  ],
  controllers: [UsersController, ForgotPasswordController],
  providers: [
    UsersService,
    SessionService,
    JwtServiceShared,
    UtilService,
    MailService,
    UFileService,
    S3Util,
  ],
  exports: [UsersService],
})
export class UsersModule {}
