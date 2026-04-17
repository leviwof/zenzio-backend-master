import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalSettingsController } from './global-settings.controller';
import { GlobalSettingsService } from './global-settings.service';
import { GlobalSettings } from './entity/global-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GlobalSettings])],
  controllers: [GlobalSettingsController],
  providers: [GlobalSettingsService],
  exports: [GlobalSettingsService],
})
export class GlobalSettingsModule {}
