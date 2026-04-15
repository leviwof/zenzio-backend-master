import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
