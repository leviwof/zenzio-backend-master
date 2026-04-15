import { IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFleetProfileDto {
  @ApiProperty({
    example: 'RES123UID',
    description: 'Fleet UID (foreign key reference)',
  })
  @IsString()
  fleetUid: string; // ✅ use UID instead of userId

  @ApiProperty({
    example: 'John',
    description: 'First name of the fleet owner or representative',
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

  @IsOptional()
  @IsString()
  @Length(3, 30)
  encryptedUsername?: string;
}
