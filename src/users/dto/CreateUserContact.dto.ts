import { IsOptional, IsString, IsEmail, IsPhoneNumber, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserContactDto {
  @ApiProperty({
    example: 'USR-27362',
    description: 'User UID (foreign key reference)',
  })
  @IsString()
  userUid: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  encryptedEmail?: string;

  @ApiProperty({
    example: '+911234567890',
    description: 'Phone number of the user (E.164 format)',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber(undefined) // undefined allows any region, specify region like 'IN' if needed
  encryptedPhone?: string;

  @ApiProperty({
    example: 'user_name123',
    description: 'Unique username',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 30)
  encryptedUsername?: string;
}
