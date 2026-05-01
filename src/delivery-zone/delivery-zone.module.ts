import { Module } from '@nestjs/common';
import { DeliveryZoneService } from './delivery-zone.service';

@Module({
  providers: [DeliveryZoneService],
  exports: [DeliveryZoneService],
})
export class DeliveryZoneModule {}
