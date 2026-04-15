import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEntity } from './entities/attendance.entity';
import { Fleet } from 'src/fleet-v2/entity/fleet.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PartitionService } from './partition.service';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { AttendancePartitionCron } from './attendance.partition-cron';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceEntity, Fleet])],

  controllers: [AttendanceController],

  providers: [AttendanceService, PartitionService, JwtServiceShared, AttendancePartitionCron],

  exports: [AttendanceService],
})
export class AttendanceModule {}
