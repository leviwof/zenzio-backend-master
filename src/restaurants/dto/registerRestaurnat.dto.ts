import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
  IsArray,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CreateRestaurantBankDetailsDto } from './CreateRestaurnatBankDetails.dto';
import { CreateRestaurantAddressDto } from './CreateRestaurantAddress.dto';
import { CreateRestaurantDocumentDto } from './create-restaurant-document.dto';

/**
 * Operational hours DTO
 */
class OperationalHourDto {
  @ApiProperty({ example: 'Mon' })
  @IsString()
  day: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: '09:00' })
  @IsString()
  from: string;

  @ApiProperty({ example: '22:00' })
  @IsString()
  to: string;
}

/**
 * Register Restaurant DTO
 */
export class RegisterRestaurantDto {
  @ApiProperty({
    description: 'Restaurant name',
    example: 'A2B Restaurant',
  })
  @IsNotEmpty({ message: 'Restaurant name is required' })
  @IsString({ message: 'restaurant_name must be a string' })
  @Length(3, 100, { message: 'Restaurant name must be between 3 and 100 characters' })
  restaurant_name: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  contact_person: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  contact_number: string;

  @ApiProperty({
    example: 'contact@a2brestaurant.com',
    description: 'Public contact email of restaurant (stored in profile table)',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid contact email format' })
  contact_email?: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  avg_cost_for_two: string;

  @ApiProperty({
    description: 'Restaurant photos (array of image URLs)',
    example: ['https://example.com/photo1.jpg'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photo?: string[];

  @ApiProperty({
    description: 'Average cost for two items',
    example: '300',
    required: false,
  })
  @IsOptional()
  @IsString()
  avg_cost_two?: string;

  @ApiProperty({
    description: 'Packaging charge per order in ₹ (set to 0 if not charging)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  packing_charge?: number;

  @ApiProperty({ example: 'a2b@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+919876543210' })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'RestaurantPass123' })
  @IsNotEmpty()
  @Length(8, 20)
  password: string;

  @ApiProperty({ required: false, type: CreateRestaurantAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRestaurantAddressDto)
  address?: CreateRestaurantAddressDto;

  @ApiProperty({ required: false, type: CreateRestaurantBankDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRestaurantBankDetailsDto)
  bank_details?: CreateRestaurantBankDetailsDto;

  @ApiProperty({ required: false, type: CreateRestaurantDocumentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRestaurantDocumentDto)
  documents?: CreateRestaurantDocumentDto;

  @ApiProperty({
    required: false,
    type: [OperationalHourDto],
    example: [
      { day: 'Mon', enabled: true, from: '09:00', to: '22:00' },
      { day: 'Tue', enabled: true, from: '09:00', to: '22:00' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperationalHourDto)
  operational_hours?: OperationalHourDto[];
}
