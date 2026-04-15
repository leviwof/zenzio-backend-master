import { IsOptional, IsString, IsArray, IsNumber } from 'class-validator';

export class UpdateRestaurantProfileDto {
  @IsOptional()
  @IsString()
  restaurant_name?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsString()
  contact_number?: string;

  @IsOptional()
  @IsString()
  avg_cost_for_two?: string;

  @IsOptional()
  @IsString()
  food_type?: string;

  @IsOptional()
  @IsArray()
  photo?: string[];

  @IsOptional()
  @IsNumber()
  deliveryRadius?: number;

  @IsOptional()
  @IsNumber()
  packing_charge?: number;
}
