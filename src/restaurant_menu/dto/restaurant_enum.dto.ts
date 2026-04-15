import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional } from 'class-validator';

export class RestaurantEnumDto {
  @ApiProperty({ example: 'Cuisine', description: 'Name of the enum item' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 0,
    description: 'Top-level category ID (0 for root items)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  father_id?: number;

  @ApiProperty({
    example: 0,
    description: 'Parent ID for grouping items under a subcategory',
    required: false,
  })
  @IsOptional()
  @IsInt()
  parent_id?: number;
}
