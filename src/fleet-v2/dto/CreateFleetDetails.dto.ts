import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// CreateBankDetailsDto.ts
export class CreateFleetDetailsDto {
  //   @ApiProperty({ example: 1, description: 'User ID (foreign key reference)' })
  //   @IsInt()
  //   userId: number;

  @ApiProperty({ example: 'HDFC Bank' })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiProperty({ example: 'HDFC0001234' })
  @IsOptional()
  @IsString()
  ifsc_code?: string;

  @ApiProperty({ example: '123456789012' })
  @IsOptional()
  @IsString()
  account_number?: string;

  @ApiProperty({ example: 'Savings' })
  @IsOptional()
  @IsString()
  account_type?: string;

  @ApiProperty({ example: 'Razorpay customer' })
  @IsOptional()
  @IsString()
  customer_id?: string;
}
