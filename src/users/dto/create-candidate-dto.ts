import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProviderType } from 'src/constants/app.enums';
import { ProfileCandidateDetailDto } from './profile-candidate-detail.dto';

export class CreateCandidateDto {
  @ApiProperty({ description: "The user's first name" })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: "The user's last name" })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'The user image for profile' })
  @IsOptional()
  @IsString()
  photo: string;

  @ApiProperty({ example: 'mohan', description: 'Name of the user' })
  @IsOptional()
  providerType: ProviderType;

  @ApiProperty({ description: 'Candidate-specific details' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ProfileCandidateDetailDto) // ✅ REQUIRED for nested validation to work
  candidate_details: ProfileCandidateDetailDto;

  @ApiProperty({ example: 'mohan', description: 'Name of the user' })
  @IsOptional()
  uid: string;
}
