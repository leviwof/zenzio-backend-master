import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  customer: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // ✅ NEW: Restaurant UID
  @IsString()
  @IsOptional()
  restaurant_uid?: string;

  // ✅ NEW: Item total (before delivery & taxes)
  @IsNumber()
  @IsOptional()
  item_total?: number;

  // ✅ NEW: Delivery fee (calculated based on distance)
  @IsNumber()
  @IsOptional()
  delivery_fee?: number;

  // ✅ NEW: Taxes
  @IsNumber()
  @IsOptional()
  taxes?: number;

  // ✅ NEW: Grand total (price = item_total + delivery_fee + taxes)
  @IsNumber()
  @IsOptional()
  price?: number;

  // ✅ NEW: Delivery address
  @IsString()
  @IsOptional()
  delivery_address?: string;

  // ✅ NEW: Restaurant coordinates
  @IsNumber()
  @IsOptional()
  restaurant_lat?: number;

  @IsNumber()
  @IsOptional()
  restaurant_lng?: number;

  // ✅ NEW: Customer coordinates
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  customer_lat?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  customer_lng?: number;

  // ✅ NEW: Distance in km
  @IsNumber()
  @IsOptional()
  distance_km?: number;

  // ✅ NEW: Payment mode
  @IsString()
  @IsOptional()
  payment_mode?: string;

  // ✅ NEW: Customer name (for notifications)
  @IsString()
  @IsOptional()
  customer_name?: string;
}
