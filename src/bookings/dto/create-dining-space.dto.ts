import { IsString, IsInt, IsOptional, IsArray, IsNotEmpty } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateDiningSpaceDto {
  @IsString()
  @IsNotEmpty()
  areaName: string;

  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  seatingCapacity: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return [value];
    return value;
  })
  photoUrls?: string[];

  @IsString()
  @IsOptional()
  bookingTimeSlot?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'null' ? null : value))
  offerId?: string;

  @IsString()
  @IsNotEmpty()
  restaurantId: string;
}
