import { IsNotEmpty, IsOptional, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProviderType } from 'src/constants/app.enums';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  uid: string;

  @ApiProperty()
  @IsNotEmpty()
  firebase_uid: string;

  @ApiProperty()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  role: string;

  @ApiProperty()
  @IsNotEmpty()
  providerType: ProviderType;

  @ApiProperty({
    example: ['https://img.com/pic.jpg'],
    description: 'User photos',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photo?: string[];
}
