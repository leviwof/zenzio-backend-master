import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CreateFleetDetailsDto } from './CreateFleetDetails.dto';
import { CreateFleetAddressDto } from './CreateFleetAddress.dto';
import { CreateFleetDocumentDto } from './createFleetDocument.dto';
import { CreateFleetEmergencyContactDto } from './create-fleet-emergecy-contact.dto';

export class RegisterFleetDto {
  // ------------------------------
  // BASIC USER DETAILS
  // ------------------------------
  @ApiProperty({ description: "Fleet owner's first name", example: 'John' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: "Fleet owner's last name", example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Work type uid',
    required: false,
    example: 'WT-ABC1234',
  })
  @IsOptional()
  @IsString()
  work_type_uid?: string;

  @ApiProperty({
    description: "Fleet owner's date of birth",
    example: '1990-12-13',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'dob must be a valid date in YYYY-MM-DD format' })
  dob?: string;

  @ApiProperty({
    description: 'Referral code (optional)',
    example: 'REF1234A',
    required: false,
  })
  @IsOptional()
  @IsString()
  referral_code?: string;

  @ApiProperty({
    description: "Fleet owner's profile photos",
    example: ['https://example.com/profile.jpg'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photo?: string[];

  // ------------------------------
  // LOGIN DETAILS
  // ------------------------------
  @ApiProperty({
    description: "Owner's email address",
    example: 'johndoe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: "Owner's phone number (with country code)",
    example: '+919876543216',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'Password for fleet account',
    example: 'MyStrongPassword123',
  })
  @IsNotEmpty()
  @Length(8, 20)
  password: string;

  // ------------------------------
  // ADDRESS DETAILS
  // ------------------------------
  @ApiProperty({
    description: 'Fleet address',
    required: false,
    type: CreateFleetAddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateFleetAddressDto)
  address?: CreateFleetAddressDto;

  // ------------------------------
  // BANK DETAILS
  // ------------------------------
  @ApiProperty({
    description: 'Fleet bank details (optional)',
    required: false,
    type: CreateFleetDetailsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateFleetDetailsDto)
  bank_details?: CreateFleetDetailsDto;

  // ------------------------------
  // DOCUMENT DETAILS
  // ------------------------------
  @ApiProperty({
    description: 'Vehicle + ID documents',
    required: false,
    type: CreateFleetDocumentDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateFleetDocumentDto)
  documents?: CreateFleetDocumentDto;

  // ------------------------------
  // EMERGENCY CONTACTS
  // ------------------------------
  @ApiProperty({
    description: 'Emergency contact list',
    required: false,
    type: [CreateFleetEmergencyContactDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateFleetEmergencyContactDto)
  emergencyContacts?: CreateFleetEmergencyContactDto[];
}
