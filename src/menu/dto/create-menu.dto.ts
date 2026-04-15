// src/menu/dto/create-menu.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CustomizationOptionDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  type?: string; // e.g. 'size' | 'topping'
}

export class CreateMenuDto {
  @IsString()
  dishName: string;

  @IsOptional()
  @IsString()
  dishDescription?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  cuisineType?: string;

  @IsOptional()
  @IsBoolean()
  vegetarian?: boolean;

  @IsOptional()
  @IsBoolean()
  containsAllergens?: boolean;

  @IsOptional()
  @IsString()
  allergens?: string;

  // This will commonly come as a JSON string when using multipart/form-data.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomizationOptionDto)
  customizationOptions?: CustomizationOptionDto[];
}
