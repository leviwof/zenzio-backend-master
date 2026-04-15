import { IsOptional, IsInt, IsString } from 'class-validator';

export class UpdateCartStatusDto {
  @IsOptional()
  @IsString()
  fleet_uid?: string;

  @IsOptional()
  @IsInt()
  pay_mode?: string;

  @IsOptional()
  @IsInt()
  pay_status?: string; // verified

  @IsOptional()
  @IsString()
  pay_status_flag?: string;

  @IsOptional()
  @IsInt()
  status?: string;

  @IsOptional()
  @IsInt()
  f_status?: string;

  @IsOptional()
  @IsInt()
  r_status?: string;

  @IsOptional()
  @IsInt()
  m_status?: number;

  @IsOptional()
  @IsString()
  status_flag?: string;

  @IsOptional()
  @IsString()
  f_status_flag?: string;

  @IsOptional()
  @IsString()
  r_status_flag?: string;

  @IsOptional()
  @IsString()
  m_status_flag?: string;
}
