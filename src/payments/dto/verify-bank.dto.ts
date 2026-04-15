import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class VerifyBankDto {
  @IsString()
  @IsNotEmpty()
  fundAccountId: string;

  @IsNumber()
  amount: number; // 100 = ₹1

  @IsString()
  currency: string; // "INR"
}
