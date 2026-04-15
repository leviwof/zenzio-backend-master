import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';
// import { Transform } from 'class-transformer';

export class CreateFleetDocumentDto {
  @ApiProperty({ example: 'FLT12345', required: false })
  @IsOptional()
  @IsString()
  fleetUid?: string;

  // ---------------------------
  // PERSONAL DOCUMENT NUMBERS
  // ---------------------------
  @ApiProperty({ example: '123456789012', required: false })
  @IsOptional()
  @IsString()
  aadharNumber?: string;

  @ApiProperty({ example: 'TN0123456789123', required: false })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  // ---------------------------
  // VEHICLE DETAILS
  // ---------------------------
  @ApiProperty({ example: 'Bike', required: false })
  @IsOptional()
  @IsString()
  vehicle_type?: string;

  @ApiProperty({ example: 'TN14AB1234', required: false })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiProperty({ example: 'Honda Activa 6G', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ example: 'Black', required: false })
  @IsOptional()
  @IsString()
  vehicleColor?: string;

  @ApiProperty({ example: 'INS-789465123', required: false })
  @IsOptional()
  @IsString()
  insuranceNo?: string;

  @ApiProperty({ example: 'ENG1234567', required: false })
  @IsOptional()
  @IsString()
  engineNo?: string;

  @ApiProperty({ example: 'CHS987654321', required: false })
  @IsOptional()
  @IsString()
  frameNo?: string;

  // ---------------------------
  // FILES – ARRAY OF STRINGS
  // ---------------------------
  @ApiProperty({
    example: ['file1.png', 'file2.png'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  file_insurance?: string[];

  @ApiProperty({
    example: ['aadhar_front.png', 'aadhar_back.png'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  file_aadhar?: string[];

  @ApiProperty({
    example: ['pan_front.png'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  file_pan?: string[];

  @ApiProperty({
    example: ['rc_front.png'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  file_rc?: string[];

  @ApiProperty({
    example: ['other_doc1.png', 'other_doc2.png'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  file_other?: string[];
}
