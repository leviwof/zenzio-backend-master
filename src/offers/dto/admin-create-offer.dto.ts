import { IsOptional, IsString } from 'class-validator';

export class AdminActionDto {
  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
