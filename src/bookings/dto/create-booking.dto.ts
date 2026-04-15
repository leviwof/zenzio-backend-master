import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsDateString()
  date: string; // ISO 8601 date string

  @IsNotEmpty()
  @IsNumber()
  guests: number;

  @IsOptional()
  @IsString()
  specialRequest?: string;

  @IsNotEmpty()
  restaurant_id: string;

  @IsNotEmpty()
  @IsString()
  bookingTime: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsUUID()
  diningSpaceId?: string;

  @IsOptional()
  @IsUUID()
  event_id?: string;
}
