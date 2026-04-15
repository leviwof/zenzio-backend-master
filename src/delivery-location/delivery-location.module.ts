import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryLocation } from './delivery_location.entity';
import { DeliveryLocationController } from './delivery-location.controller';
import { DeliveryLocationService } from './delivery-location.service';
import { JwtServiceShared } from 'src/shared/jwt.service';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryLocation])],
  controllers: [DeliveryLocationController],
  providers: [DeliveryLocationService, JwtServiceShared],
  exports: [DeliveryLocationService],
})
export class DeliveryLocationModule {}
