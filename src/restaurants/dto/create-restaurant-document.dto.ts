import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class CreateRestaurantDocumentDto {
  @ApiProperty({
    example: 'RES123UID',
    description: 'Restaurant UID (foreign key reference)',
  })
  @IsString()
  @IsOptional()
  restaurantUid: string; // ✅ use UID instead of userId
  // FSSAI
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fssai_number?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  file_fssai?: string[];

  // GST
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  gst_number?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  file_gst?: string[];

  // Trade License
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  trade_license_number?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  file_trade_license?: string[];

  // Other Docs
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  otherDocumentType?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  file_other_doc?: string[];
}
