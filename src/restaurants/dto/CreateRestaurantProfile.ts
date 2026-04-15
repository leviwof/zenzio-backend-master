import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRestaurantProfileDto {
  @ApiProperty({
    example: 'RES123UID',
    description: 'Restaurant UID (foreign key reference)',
  })
  @IsString()
  restaurantUid: string; // ✅ use UID instead of userId

  @ApiProperty({
    example: 'John',
    description: 'First name of the restaurant owner or representative',
  })
  @IsString()
  @Length(2, 50)
  first_name: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  last_name?: string;

  @ApiProperty({
    example: 'https://example.com/photo.jpg',
    description: 'Profile photo URL (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiProperty({
    example: 'restaurant@email.com',
    description: 'Restaurant email (optional)',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  contact_email?: string;
  @ApiProperty({
    example: 'https://example.com/photo.jpg',
    description: 'Profile photo URL (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  avg_cost_for_two?: string;

  @IsOptional()
  @IsString()
  @Length(3, 30)
  encryptedUsername?: string;
}
