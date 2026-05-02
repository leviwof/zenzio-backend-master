import { IsBoolean, IsOptional, IsString, IsNumber } from 'class-validator';

export class CouponValidationResponseDto {
  @IsBoolean()
  isValidForUser: boolean;

  @IsOptional()
  @IsString()
  reason?:
    | 'EXPIRED'
    | 'INACTIVE'
    | 'MIN_ORDER_NOT_MET'
    | 'USER_LIMIT_REACHED'
    | 'LIMIT_REACHED'
    | 'NOT_ELIGIBLE'
    | null;

  @IsString()
  message: string;

  @IsString()
  status: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  finalAmount?: number;
}

export class CouponWithFailureReasonDto {
  isValidForUser: boolean;
  status: string;
  endDate: string;
  failureReason: string | null;
  failureMessage: string | null;
  [key: string]: any;
}
