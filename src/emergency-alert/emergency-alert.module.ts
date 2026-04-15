import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergencyAlert } from './emergency-alert.entity';
import { EmergencyAlertService } from './emergency-alert.service';
import { EmergencyAlertController } from './emergency-alert.controller';
import { JwtServiceShared } from 'src/shared/jwt.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmergencyAlert])],
  controllers: [EmergencyAlertController],
  providers: [EmergencyAlertService, JwtServiceShared],
  exports: [EmergencyAlertService],
})
export class EmergencyAlertModule {}
