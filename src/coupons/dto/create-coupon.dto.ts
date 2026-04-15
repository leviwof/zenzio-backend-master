import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';
import { DiscountType, CouponStatus } from '../coupon.entity';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DiscountType)
  @IsNotEmpty()
  discountType: DiscountType;

  @IsNumber()
  @IsNotEmpty()
  discountValue: number;

  @IsNumber()
  @IsNotEmpty()
  minOrderValue: number;

  @IsNumber()
  @IsOptional()
  maxDiscountCap?: number;

  @IsNumber()
  @IsOptional()
  usageLimit?: number;

  @IsNumber()
  @IsOptional()
  usageLimitPerUser?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  targetAudience?: string;

  @IsEnum(CouponStatus)
  @IsOptional()
  status?: CouponStatus;

  @IsString()
  @IsOptional()
  assigned_to_uid?: string;

  @IsString()
  @IsOptional()
  source?: string;
}
