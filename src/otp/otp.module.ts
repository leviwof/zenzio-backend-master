import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from 'src/mail/mail.module';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { OtpEntity } from './otp.entity';
import { SmsService } from './sms.service';

@Module({
  imports: [TypeOrmModule.forFeature([OtpEntity]), MailModule],
  controllers: [OtpController],
  providers: [OtpService, SmsService],
  exports: [OtpService, SmsService], //
})
export class OtpModule {}
