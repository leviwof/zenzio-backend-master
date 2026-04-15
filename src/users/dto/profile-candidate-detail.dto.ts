// dto/profile-candidate-detail.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty, IsArray, IsBoolean } from 'class-validator';

export class ProfileCandidateDetailDto {
  @ApiProperty({ description: 'Vendor ID or name' })
  @IsNotEmpty()
  @IsString()
  vendor: string;

  @ApiProperty({ description: 'Years of experience', required: false })
  @IsOptional()
  @IsString()
  years_of_experience?: string;

  @ApiProperty({ description: 'Availability', required: false })
  @IsOptional()
  @IsBoolean()
  availablity?: boolean;

  @ApiProperty({ description: 'Work preference', required: false })
  @IsOptional()
  @IsString()
  work_preference?: string;

  @ApiProperty({ description: 'Skills', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ description: 'Languages', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiProperty({ description: 'Qualifications', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  qualification?: string[];
}
