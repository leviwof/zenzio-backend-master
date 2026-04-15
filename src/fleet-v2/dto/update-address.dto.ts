import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFleetAddressDto {
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

  @ApiProperty({ example: 'No. 42, Gandhi Street', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 13.08268, required: false })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiProperty({ example: 80.270718, required: false })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiProperty({ example: 'Near Central Railway Station', required: false })
  @IsOptional()
  @IsString()
  land_mark?: string;
}
