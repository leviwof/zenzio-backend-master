import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginEmailDto {
  @ApiProperty({ description: "The user's email address", required: false })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : value))
  @IsEmail()
  email?: string;

  @ApiProperty({ description: "The user's password", required: false })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : value))
  @Length(8, 20)
  password?: string;

  @ApiProperty({ description: "The user's phone number" })
  @IsNotEmpty()
  @Length(10, 15)
  phone: string;

  @ApiProperty({ description: 'Mobile Otp' })
  @IsNotEmpty()
  @Length(4, 6)
  otp: string;
}

export class LoginOtpDto {
  // @ApiProperty({ description: "The user's phone number (E.164 format)" })
  // @IsNotEmpty()
  // @IsPhoneNumber()
  // phone: string;

  // @ApiProperty({ description: "The OTP sent to the user's phone" })
  // @IsNotEmpty()
  // @Length(4, 6)
  // otp: string;

  @ApiProperty({ description: "The user's phone number" })
  @IsNotEmpty()
  @Length(10, 15)
  phone: string;

  @ApiProperty({ description: 'Mobile Otp' })
  @IsNotEmpty()
  @Length(4, 6)
  otp: string;
}
