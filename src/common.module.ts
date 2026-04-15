import { Module } from '@nestjs/common';
import { UtilService } from './utils/util.service';

@Module({
  providers: [UtilService],
  exports: [UtilService],
})
export class CommonModule {}
