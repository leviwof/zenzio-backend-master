import { Body, Controller, Get, Patch } from '@nestjs/common';
import { GlobalSettingsService } from './global-settings.service';
import { UpdateGlobalSettingsDto } from './dto/update-global-settings.dto';

@Controller('global-settings')
export class GlobalSettingsController {
  constructor(private readonly settingsService: GlobalSettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  updateSettings(@Body() updateDto: UpdateGlobalSettingsDto) {
    return this.settingsService.updateSettings(updateDto);
  }
}
