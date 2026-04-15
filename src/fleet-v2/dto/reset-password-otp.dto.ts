import { IsString, IsNotEmpty, Length } from 'class-validator';

export class ResetPasswordOtpDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  newPassword: string;
}
