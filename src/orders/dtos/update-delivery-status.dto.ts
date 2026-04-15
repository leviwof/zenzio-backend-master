import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export const DELIVERY_STATUSES = [
  'new',
  'accepted',
  'assigned',
  'on_the_way_to_restaurant',
  'reached_restaurant',
  'picked_up',
  'out_for_delivery',
  'on_the_way_to_customer',
  'delivered',
  'cancelled',
  'admin_cancelled',
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export class UpdateDeliveryStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(DELIVERY_STATUSES as unknown as string[])
  status: DeliveryStatus;
}
