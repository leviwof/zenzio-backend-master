import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateRestaurantDto {
  @ApiProperty({ example: 'Arabian Grill', required: false })
  @IsOptional()
  @IsString()
  restaurant_name?: string;

  @ApiProperty({ example: 'Mohan', required: false })
  @IsOptional()
  @IsString()
  contact_person?: string;

  @ApiProperty({ example: '9876543210', required: false })
  @IsOptional()
  @IsString()
  contact_number?: string;

  @ApiProperty({
    example: 'rest_7f92ab4d@gmail.com',
    description: 'Primary contact email for the restaurant',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  contact_email?: string;

  @ApiProperty({ example: '450', required: false })
  @IsOptional()
  @IsString()
  avg_cost_for_two?: string;

  @ApiProperty({
    type: [String],
    example: ['photo1.jpg', 'photo2.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  photo?: string[];
}
