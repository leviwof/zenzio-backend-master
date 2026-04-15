import { IsString, IsNumber, IsBoolean } from 'class-validator';

export class ProductsDto {
  @IsString()
  title: string;

  @IsNumber()
  price: number;

  @IsString()
  description: string;

  @IsBoolean()
  isActive: boolean;
}
