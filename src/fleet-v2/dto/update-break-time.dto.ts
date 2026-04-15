import { IsOptional, IsString } from 'class-validator';

export class UpdateBreakTimeDto {
  @IsOptional()
  @IsString()
  break_start_time?: string;

  @IsOptional()
  @IsString()
  break_end_time?: string;
}
