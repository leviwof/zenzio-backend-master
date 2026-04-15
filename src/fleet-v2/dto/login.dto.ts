import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class FleetLoginEmailDto {
  @ApiProperty({ description: "The user's email address" })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "The user's password" })
  @IsNotEmpty()
  @Length(8, 20)
  password: string;
}

export class FleetLoginOtpDto {
  @ApiProperty({ description: "The user's phone number" })
  @IsNotEmpty()
  @Length(10, 15)
  phone: string;

  @ApiProperty({ description: 'Mobile Otp' })
  @IsNotEmpty()
  @Length(4, 6)
  otp: string;
}
