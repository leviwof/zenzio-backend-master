import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentPassword123', description: 'Current password' })
  @IsNotEmpty()
  @IsString()
  current_password: string;

  @ApiProperty({ example: 'newPassword456', description: 'New password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  new_password: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'newPassword456', description: 'New password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  new_password: string;
}
