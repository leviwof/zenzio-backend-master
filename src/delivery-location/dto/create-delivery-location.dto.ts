import { IsNotEmpty, IsNumber, IsString, IsBoolean, IsIn, IsOptional } from 'class-validator';
import { AddressType } from '../delivery_location.entity';

export class CreateDeliveryLocationDto {
  @IsOptional()
  @IsString()
  user_uid?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsBoolean()
  is_default: boolean;

  @IsIn(['primary', 'home', 'office', 'public', 'guest'], {
    message: 'address_type must be one of: primary, home, office, public, guest',
  })
  address_type: AddressType;
}
