import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateBankDetailsDto } from './CreateBankDetails.dto';
import { CreateUserAddressDto } from './CreateUserAddress.dto';

export class RegisterUserDto {
  @ApiProperty({ description: "The user's first name" })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: "The user's last name" })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'The user image for profile', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photo?: string[];

  @ApiProperty({ description: "The user's date of birth", required: false })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsDateString({ strict: true }, { message: 'DOB must be a valid ISO Date string' })
  dob: string;

  @ApiProperty({ description: "The user's anniversary date", required: false })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsDateString({ strict: true }, { message: 'Anniversary must be a valid ISO Date string' })
  anniversary: string;

  @ApiProperty({ description: "The user's email address" })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "The user's phone number" })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: "The user's password" })
  @IsNotEmpty()
  @Length(8, 20)
  password: string;

  @ApiProperty({ type: CreateBankDetailsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBankDetailsDto)
  bank_details?: CreateBankDetailsDto;

  @ApiProperty({ type: CreateUserAddressDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUserAddressDto)
  address?: CreateUserAddressDto;


  @ApiProperty({
    description: 'User accepted terms & conditions',
    type: Boolean,
    default: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  tnc_accepted: boolean;

  @ApiProperty({ description: 'Referral code from another user', required: false })
  @IsOptional()
  @IsString()
  refer_code?: string;
}
