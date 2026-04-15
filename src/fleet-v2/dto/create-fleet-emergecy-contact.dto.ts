import { IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFleetEmergencyContactDto {
  @ApiProperty({ example: 'Raj Kumar' })
  @IsString()
  contact_person: string;

  @ApiProperty({ example: 'Brother' })
  @IsString()
  relationship: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  primary_contact: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  secondary_contact: boolean;

  @ApiProperty({ example: '12/3 Gandhi Street' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Chennai' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Tamil Nadu' })
  @IsString()
  state: string;

  @ApiProperty({ example: '600017' })
  @IsString()
  pincode: string;
}
