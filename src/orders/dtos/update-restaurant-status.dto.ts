import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export const RESTAURANT_STATUSES = [
  'new',
  'accepted',
  'preparing',
  'ready',
  'picked_up',
  'out_for_delivery',
  'rejected',
] as const;
export type RestaurantStatus = (typeof RESTAURANT_STATUSES)[number];

export class UpdateRestaurantStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(RESTAURANT_STATUSES as unknown as string[])
  status: RestaurantStatus;

  @IsString()
  @IsOptional()
  estimated_time?: string;
}
