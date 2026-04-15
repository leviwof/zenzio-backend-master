import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';

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

  @ApiProperty({ example: '123 Delivery Street', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Near Bus Stand', required: false })
  @IsOptional()
  @IsString()
  land_mark?: string;

  @ApiProperty({ example: '12.9716000', required: false })
  @IsOptional()
  @IsNumberString()
  lat?: string;

  @ApiProperty({ example: '77.5946000', required: false })
  @IsOptional()
  @IsNumberString()
  lng?: string;
}
