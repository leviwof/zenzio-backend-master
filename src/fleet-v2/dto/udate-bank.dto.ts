import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFleetBankDto {
  @ApiProperty({ example: 'HDFC Bank', required: false })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiProperty({ example: '123456789012', required: false })
  @IsOptional()
  @IsString()
  account_number?: string;

  @ApiProperty({ example: 'HDFC0000456', required: false })
  @IsOptional()
  @IsString()
  ifsc_code?: string;

  @ApiProperty({ example: 'Savings', required: false })
  @IsOptional()
  @IsString()
  account_type?: string;

  @ApiProperty({ example: 'acc_YZ89GH77', required: false })
  @IsOptional()
  @IsString()
  razorpay_accid?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}
