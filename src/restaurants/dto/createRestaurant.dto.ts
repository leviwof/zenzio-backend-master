import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProviderType } from 'src/constants/app.enums';
import { OperationalHourDto } from './operational-hour.dto';

/**
 * ✅ Core CreateRestaurant DTO
 */
export class CreateRestaurantDto {
  @ApiProperty({
    example: 'rest_7f92ab4d',
    description: 'Unique UID of the restaurant',
  })
  @IsNotEmpty()
  @IsString()
  uid: string;

  @ApiProperty({ example: 'firebase_12345', description: 'Firebase UID' })
  @IsNotEmpty()
  @IsString()
  firebase_uid: string;

  @ApiProperty({ example: 'John', description: 'First name of the restaurant owner' })
  @IsNotEmpty()
  @IsString()
  restaurant_name: string;

  @ApiProperty({ example: 'John', description: 'First name of the restaurant owner' })
  @IsNotEmpty()
  @IsString()
  contact_person: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the restaurant owner' })
  @IsNotEmpty()
  @IsString()
  contact_number: string;

  @ApiProperty({ example: 'restaurant_admin', description: 'User role' })
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty({
    example: ProviderType.PASSWORD,
    description: 'Provider type (Email / Google / etc.)',
  })
  @IsNotEmpty()
  providerType: ProviderType;

  @ApiProperty({
    example: ['https://example.com/photo.jpg'],
    description: 'Restaurant photos (array of image URLs)',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photo?: string[];

  @ApiProperty({
    example: '300',
    description: 'Average cost for two people',
    required: false,
  })
  @IsOptional()
  @IsString()
  avg_cost_for_two?: string;

  @ApiProperty({
    type: [OperationalHourDto],
    description: 'Operational hours of the restaurant',
    required: false,
    example: [
      { day: 'Mon', enabled: true, from: '21:00', to: '23:00', restaurantUid: 'rest_12345' },
      { day: 'Tue', enabled: true, from: '21:00', to: '23:00', restaurantUid: 'rest_12345' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperationalHourDto)
  operational_hours?: OperationalHourDto[];
}
