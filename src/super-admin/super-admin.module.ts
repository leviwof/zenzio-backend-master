import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { SuperAdmin } from './super-admin.entity';
import { Argon2Service } from 'src/shared/argon2.service';
import { AuthModule } from 'src/auth/auth.module';
import { UtilService } from 'src/utils/util.service';

import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [AuthModule, MailModule, TypeOrmModule.forFeature([SuperAdmin])],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, Argon2Service, UtilService],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
