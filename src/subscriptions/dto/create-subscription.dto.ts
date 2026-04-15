import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  restaurant_id: string;

  @IsNotEmpty()
  @IsString()
  plan_id: string;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
