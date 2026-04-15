import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsArray, IsBoolean } from 'class-validator';

export class CreateOfferDto {
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  discountType: 'PERCENTAGE' | 'FLAT';

  @Type(() => Number)
  @IsNumber()
  discountValue: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  minOrderValue?: number;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsArray()
  applicableItems?: string[];

  @IsOptional()
  @IsString()
  termsConditions?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isCommissionAuto?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  adminCommission?: number;
}
