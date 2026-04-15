import { IsNotEmpty, MinLength, IsString } from 'class-validator';

export class ConfirmResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  oobCode: string;

  @MinLength(6)
  newPassword: string;
}
