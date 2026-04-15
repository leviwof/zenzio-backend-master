import { IsOptional, IsString, IsDateString, IsArray, MinLength } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photo?: string[];

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsDateString()
  anniversary?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;
}
