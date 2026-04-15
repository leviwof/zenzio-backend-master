import { IsOptional, IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateWorkTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  start_time?: string;

  @IsString()
  @IsOptional()
  end_time?: string;

  @IsString()
  @IsOptional()
  break_start_time?: string;

  @IsString()
  @IsOptional()
  break_end_time?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
