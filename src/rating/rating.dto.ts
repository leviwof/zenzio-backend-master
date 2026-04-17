import { ApiProperty } from '@nestjs/swagger';

export class BaseSingleRatingDto {
  @ApiProperty({ example: 'GRP-ORDER-001' })
  group_id: string;

  @ApiProperty({ example: 5, description: 'Rating value (e.g. 1–5)' })
  rating: number;

  @ApiProperty({
    required: false,
    example: 'Everything was great!',
    description: 'Optional rating description / feedback',
  })
  description?: string;
}

export class CustRestaurantRatingDto extends BaseSingleRatingDto {}
export class CustFleetRatingDto extends BaseSingleRatingDto {}
export class FleetCustRatingDto extends BaseSingleRatingDto {}
export class FleetRestRatingDto extends BaseSingleRatingDto {}
export class RestFleetRatingDto extends BaseSingleRatingDto {}
export class RestCustRatingDto extends BaseSingleRatingDto {}
export class CusAppRatingDto extends BaseSingleRatingDto {}
export class RestAppRatingDto extends BaseSingleRatingDto {}
export class FleetAppRatingDto extends BaseSingleRatingDto {}

import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class SubmitOrderRatingDto {
  @ApiProperty({ example: 'ORD-123456', description: 'The unique Order ID' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 5, description: 'Rating for the Restaurant (1-5)' })
  @IsNumber()
  @IsNotEmpty()
  restaurantRating: number;

  @ApiProperty({ required: false, description: 'Review for the Restaurant' })
  @IsString()
  @IsOptional()
  restaurantReview?: string;

  @ApiProperty({
    required: false,
    example: 5,
    description: 'Rating for the Delivery Partner (1-5)',
  })
  @IsNumber()
  @IsOptional()
  driverRating?: number;

  @ApiProperty({ required: false, description: 'Review for the Delivery Partner' })
  @IsString()
  @IsOptional()
  driverReview?: string;
}
