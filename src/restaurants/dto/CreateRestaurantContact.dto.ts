import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsPhoneNumber } from 'class-validator';
import { Restaurant } from '../entity/restaurant.entity';

export class CreateRestaurnatContactDto {
  @ApiProperty({
    example: 'RES12345',
    description: 'Restaurant UID (foreign key reference)',
  })
  @IsString()
  restaurantUid: string; // ✅ single correct definition

  @ApiProperty({
    example: 'encrypted@example.com',
    description: 'Encrypted email address',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  encryptedEmail?: string;

  @ApiProperty({
    example: '+911234567890',
    description: 'Encrypted phone number (E.164 format)',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber(undefined)
  encryptedPhone?: string;

  @ApiProperty({
    example: 'encrypted_user123',
    description: 'Encrypted username (optional)',
    required: false,
  })
  // Optional plain contact info (can be filled later)
  @ApiProperty({
    example: 'contact@example.com',
    required: false,
    description: 'Plain contact email (optional)',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiProperty({
    example: '+919876543210',
    required: false,
    description: 'Plain contact phone (optional)',
  })
  @IsOptional()
  @IsPhoneNumber(undefined)
  contactPhone?: string;

  // Relation reference (not required when creating)
  restaurant?: Restaurant;
}
