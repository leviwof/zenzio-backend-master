import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentModeDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['COD', 'ONLINE'], {
    message: 'pay_mode must be either COD or ONLINE',
  })
  pay_mode: 'COD' | 'ONLINE';

  @IsOptional()
  @IsNumber()
  delivery_fee?: number;

  @IsOptional()
  @IsNumber()
  taxes?: number;

  @IsOptional()
  @IsNumber()
  item_total?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  delivery_address?: string;

  @IsOptional()
  @IsNumber()
  restaurant_lat?: number;

  @IsOptional()
  @IsNumber()
  restaurant_lng?: number;

  @IsOptional()
  @IsNumber()
  customer_lat?: number;

  @IsOptional()
  @IsNumber()
  customer_lng?: number;

  @IsOptional()
  @IsNumber()
  distance_km?: number;

  @IsOptional()
  @IsString()
  coupon_code?: string;

  @IsOptional()
  @IsNumber()
  coupon_discount?: number;
}
