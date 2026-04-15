import { IsOptional, IsString, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFleetProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  photo?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  work_type_uid?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  end_time?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  break_start_time?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  break_end_time?: string;
}
