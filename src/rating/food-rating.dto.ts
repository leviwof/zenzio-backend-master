import { ApiProperty } from '@nestjs/swagger';

export class FoodRatingDto {
  @ApiProperty({ example: 'GRP-ORDER-001' })
  group_id: string;

  @ApiProperty({ example: 'CUS-001' })
  cus_uid: string;

  @ApiProperty({ example: 'MENU-123' })
  menu_uid: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ example: 'Very tasty!', required: false })
  description?: string;
}
