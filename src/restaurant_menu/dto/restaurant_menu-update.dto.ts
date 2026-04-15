import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsBoolean, IsOptional, IsArray, IsNumber } from 'class-validator';

export class RestaurantMenuUpdateDto {
  @ApiProperty({
    example: 'Chicken Biryani',
    description: 'Name of the menu item',
    required: false,
  })
  @IsOptional()
  @IsString()
  menu_name?: string;

  @ApiProperty({
    example: 300,
    description: 'Price of the menu item (in INR)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    example: 10,
    description: 'Discount percentage for the item',
    required: false,
  })
  @IsOptional()
  @IsInt()
  discount?: number;

  @ApiProperty({
    example: 'Aromatic basmati rice with tender chicken pieces',
    description: 'Description of the menu item',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the menu item is currently active',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 'Main Course',
    required: false,
    description: 'Food category (e.g., Starter, Main Course, Dessert)',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    example: 'Non-Veg',
    required: false,
    description: 'Food type (Veg, Non-Veg, Vegan)',
  })
  @IsOptional()
  @IsString()
  food_type?: string;

  @ApiProperty({
    example: 'Indian',
    required: false,
    description: 'Cuisine type (Indian, Chinese, Italian, etc.)',
  })
  @IsOptional()
  @IsString()
  cuisine_type?: string;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Whether item contains allergens',
  })
  @IsOptional()
  @IsBoolean()
  contain_allergence?: boolean;

  @ApiProperty({
    example: 'Contains dairy products',
    required: false,
    description: 'Specify allergence if exists',
  })
  @IsOptional()
  @IsString()
  specify_allergence?: string;

  @ApiProperty({
    example: [
      { name: 'Extra Chicken', price: 50 },
      { name: 'Add Egg', price: 20 },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  customized_option?: any[];

  @ApiProperty({
    example: [
      { name: 'Large', price: 50 },
      { name: 'Medium', price: 30 },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  size_option?: any[];

  @ApiProperty({
    example: [
      { name: 'Cheese', price: 40 },
      { name: 'Mushrooms', price: 30 },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  topping?: any[];

  @ApiProperty({
    example: 'Large',
    required: false,
    description: 'Size of the menu item',
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Default quantity for ordering',
  })
  @IsOptional()
  @IsInt()
  qty?: number;

  @ApiProperty({
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    required: false,
    type: [String],
    description: 'Images of the menu item',
  })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiProperty({
    example: 4.5,
    required: false,
    description: 'Average rating of this menu item',
  })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiProperty({
    example: 124,
    required: false,
    description: 'Order count of this item',
  })
  @IsOptional()
  @IsInt()
  orderedCount?: number;
}
