import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateGlobalSettingsDto {
  @IsBoolean()
  @IsOptional()
  enableOnlinePayment?: boolean;

  @IsBoolean()
  @IsOptional()
  enableCODPayment?: boolean;
}
