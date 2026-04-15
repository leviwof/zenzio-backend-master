import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EmergencyAlertStatus } from '../emergency-alert-status.enum';
import { EmergencyMeta } from '../emergency-meta.interface';

export class UpdateEmergencyStatusDto {
  @IsEnum(EmergencyAlertStatus)
  status: EmergencyAlertStatus;

  @IsOptional()
  @IsString()
  resolved_by_uid?: string;

  @IsOptional()
  @IsString()
  resolution_note?: string;

  @IsOptional()
  meta?: EmergencyMeta;
}
