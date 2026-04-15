import { IsNumber, IsOptional, IsString } from 'class-validator';

export class OrderItemDto {
  @IsOptional()
  @IsNumber()
  menuItemId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  price?: number; // optional fallback

  @IsNumber()
  qty: number;
}
