import { ApiProperty } from '@nestjs/swagger';
import { Fleet } from '../entity/fleet.entity';
// import { Fleet } from 'src/fleet/fleet.entity';
// import { Fleet } from '../entity/fleet.entity';
// import { Fleet } from '../../entities/fleet.entity';
// Fleet
// Fleet
export class GetFleetDocumentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fleetId: number;

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

  @ApiProperty({ type: () => Fleet, required: false })
  fleet?: Fleet;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
