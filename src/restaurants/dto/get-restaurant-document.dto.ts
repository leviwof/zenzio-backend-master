import { ApiProperty } from '@nestjs/swagger';
import { Restaurant } from '../entity/restaurant.entity';
// import { Restaurant } from '../../entities/restaurant.entity';
// Restaurant

export class GetRestaurantDocumentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  restaurantId: number;

  @ApiProperty({ required: false })
  fssaiNumber?: string;

  @ApiProperty({ required: false })
  fssaiCertificateUrl?: string;

  @ApiProperty({ required: false })
  gstNumber?: string;

  @ApiProperty({ required: false })
  gstCertificateUrl?: string;

  @ApiProperty({ required: false })
  tradeLicenseNumber?: string;

  @ApiProperty({ required: false })
  tradeLicenseUrl?: string;

  @ApiProperty({ required: false })
  otherDocumentType?: string;

  @ApiProperty({ required: false })
  otherDocumentUrl?: string;

  @ApiProperty({ type: () => Restaurant, required: false })
  restaurant?: Restaurant;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
