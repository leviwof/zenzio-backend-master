import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { TestEmailController } from './test-email.controller';

@Module({
  controllers: [TestEmailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
