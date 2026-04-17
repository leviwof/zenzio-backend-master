import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalSettings } from './entity/global-settings.entity';
import { UpdateGlobalSettingsDto } from './dto/update-global-settings.dto';

@Injectable()
export class GlobalSettingsService {
  constructor(
    @InjectRepository(GlobalSettings)
    private settingsRepository: Repository<GlobalSettings>,
  ) {}

  async getSettings(): Promise<GlobalSettings> {
    const settings = await this.settingsRepository.find();
    if (settings.length > 0) {
      return settings[0];
    }
    // Create default settings if none exist
    const defaultSettings = this.settingsRepository.create({
      enableOnlinePayment: true,
      enableCODPayment: true,
    });
    return this.settingsRepository.save(defaultSettings);
  }

  async updateSettings(updateDto: UpdateGlobalSettingsDto): Promise<GlobalSettings> {
    const settings = await this.getSettings();
    Object.assign(settings, updateDto);
    return this.settingsRepository.save(settings);
  }
}
