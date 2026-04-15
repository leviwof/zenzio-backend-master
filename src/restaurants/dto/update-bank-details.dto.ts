import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateBankDetailsDto {
  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsOptional()
  @IsString()
  account_number?: string;

  @IsOptional()
  @IsString()
  ifsc_code?: string;

  @IsOptional()
  @IsString()
  account_type?: string;

  @IsOptional()
  @IsString()
  razorpay_accid?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}
