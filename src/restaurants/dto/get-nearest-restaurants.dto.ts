import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RestaurantFilter {
  ALL = 'all',
  POPULAR = 'popular',
  NEW = 'new',
  TOP_OFFERS = 'top_offers',
  DINING = 'dining',
}

export enum RestaurantSortBy {
  RATING = 'rating',
  DELIVERY_TIME = 'delivery_time',
  DISTANCE = 'distance',
  COST = 'cost',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetNearestRestaurantsDto {
  @ApiProperty({ description: 'User latitude' })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'User longitude' })
  @IsNumber()
  lng: number;

  @ApiProperty({ description: 'Search radius in km', default: 10, required: false })
  @IsNumber()
  @IsOptional()
  radius?: number = 10;

  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', default: 10, required: false })
  @IsNumber()
  @IsOptional()
  limit?: number = 10;


  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'pizza' })
  search?: string;

  @ApiProperty({
    description: 'Filter option',
    enum: RestaurantFilter,
    default: RestaurantFilter.ALL,
    required: false,
  })
  @IsEnum(RestaurantFilter)
  @IsOptional()
  filter?: string = RestaurantFilter.ALL;

  @ApiProperty({
    description: 'Sort by field',
    enum: RestaurantSortBy,
    required: false,
  })
  @IsEnum(RestaurantSortBy)
  @IsOptional()
  sort?: string;

  @ApiProperty({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.ASC,
    required: false,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  order?: string = SortOrder.ASC;
}
