import { IsString, IsNumber } from 'class-validator';

export class AddToCartDto {
  @IsString()
  restaurant_uid: string;

  @IsString()
  menu_uid: string;

  @IsString()
  menu_name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  qty: number;
}

// test trigger for build
