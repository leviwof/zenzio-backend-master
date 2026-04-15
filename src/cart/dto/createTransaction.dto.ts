import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCartTransactionDto {
  @IsNotEmpty()
  @IsString()
  cart_group_uid: string;

  @IsNotEmpty()
  @IsString()
  user_uid: string;

  @IsEnum(['cod', 'online'])
  mode: 'cod' | 'online';

  @IsOptional()
  status?: number;

  @IsOptional()
  order_id?: string;

  @IsOptional()
  payment_id?: string;

  @IsOptional()
  refund_request?: boolean;

  @IsOptional()
  refund_success?: boolean;

  @IsOptional()
  description?: string;
}
