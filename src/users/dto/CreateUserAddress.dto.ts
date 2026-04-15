import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserAddressDto {
  @ApiProperty({ example: 'Bangalore', description: 'City name' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Karnataka', description: 'State name' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: 'Karnataka', description: 'State name' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiProperty({ example: '123 MG Road', description: 'Primary address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'Near Metro Station',
    description: 'Secondary address (optional)',
  })
  @IsOptional()
  @IsString()
  address_secondary?: string;

  @ApiProperty({ example: 12.9716, description: 'Latitude', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiProperty({ example: 77.5946, description: 'Longitude', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;
}
