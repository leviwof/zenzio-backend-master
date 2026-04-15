import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetNearestMenusDto {
  @IsNumber()
  @ApiPropertyOptional({ example: 11.9439563 })
  lat: number;

  @IsNumber()
  @ApiPropertyOptional({ example: 79.8044713 })
  lng: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ example: 10 })
  radius?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ example: 1 })
  page?: number;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ example: 10 })
  limit?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'pizza' })
  search?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [String], example: ['Main Course', 'Starters'] })
  categories?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [String], example: ['Italian', 'Indian'] })
  cuisine_types?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({ type: [String], example: ['Veg', 'Non-Veg'] })
  food_types?: string[];
}
