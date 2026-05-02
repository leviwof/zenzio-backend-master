import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CouponValidationResponseDto {
  @IsBoolean()
  valid: boolean;

  @IsOptional()
  @IsString()
  reason?: string | null;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  coupon?: {
    code: string;
    name: string;
    discountType: string;
    discountValue: number;
    minOrderValue: number;
    maxDiscountCap?: number;
  };
}

export class CouponWithFailureReasonDto {
  isValidForUser: boolean;
  status: string;
  endDate: string;
  failureReason: string | null;
  failureMessage: string | null;
  [key: string]: any;
}
