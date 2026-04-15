import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProviderType } from 'src/constants/app.enums';
import { WorkingHourDto } from './working-hour.dto';
import { CreateFleetEmergencyContactDto } from './create-fleet-emergecy-contact.dto';
/**
 * ✅ Core CreateRestaurant DTO
 */
export class CreateFleetDto {
  @ApiProperty({
    example: 'rest_7f92ab4d',
    description: 'Unique UID of the fleet',
  })
  @IsNotEmpty()
  @IsString()
  uid: string;

  @ApiProperty({ example: 'firebase_12345', description: 'Firebase UID' })
  @IsNotEmpty()
  @IsString()
  firebase_uid: string;

  @ApiProperty({ example: 'John', description: 'First name of the fleet owner' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the fleet owner' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'fleet_admin', description: 'User role' })
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty({
    example: ProviderType.PASSWORD,
    description: 'Provider type (Email / Google / etc.)',
  })
  @IsNotEmpty()
  providerType: ProviderType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photo?: string[];

  // ✅ Added operational hours field
  @ApiProperty({
    type: [WorkingHourDto],
    description: 'Operational hours of the fleet',
    example: [
      { day: 'Mon', enabled: true, from: '21:00', to: '23:00', fleetUid: 'rest_12345' },
      { day: 'Tue', enabled: true, from: '21:00', to: '23:00', fleetUid: 'rest_12345' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDto)
  @IsOptional() // ✅ ADD THIS LINE
  operational_hours?: WorkingHourDto[];

  @ApiProperty({ type: [CreateFleetEmergencyContactDto], required: false })
  @ValidateNested({ each: true })
  @Type(() => CreateFleetEmergencyContactDto)
  @IsOptional()
  emergencyContacts?: CreateFleetEmergencyContactDto[];

  @IsOptional()
  status?: boolean;

  @IsOptional()
  isActive?: boolean;
}
