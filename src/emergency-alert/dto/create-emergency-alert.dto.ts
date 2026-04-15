// import { EmergencyMeta } from '../types/emergency-meta.type';
import { IsOptional, IsNumber, IsString, IsObject } from 'class-validator';
import { EmergencyMeta } from '../emergency-meta.interface';

export class CreateEmergencyAlertDto {
  @IsOptional()
  @IsString()
  fleet_uid?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  location_address?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  meta?: EmergencyMeta;
}
