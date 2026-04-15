import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateFleetAddressDto {
  @ApiProperty({ example: 'Chennai', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Tamil Nadu', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '600001', required: false })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiProperty({ example: '123 Food Street', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  // NEW FIELDS
  @ApiProperty({ example: 13.0827, required: false })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiProperty({ example: 80.2707, required: false })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiProperty({ example: 'Near Marina Beach', required: false })
  @IsOptional()
  @IsString()
  land_mark?: string;
}
