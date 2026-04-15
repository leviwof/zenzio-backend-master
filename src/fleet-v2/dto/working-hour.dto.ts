import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class WorkingHourDto {
  @ApiProperty({ example: 'Mon', description: 'Day of the week' })
  @IsString()
  day: string;

  @ApiProperty({ example: true, description: 'Whether fleet is open on this day' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: '21:00', description: 'Opening time (24h format)' })
  @IsString()
  from: string;

  @ApiProperty({ example: '23:00', description: 'Closing time (24h format)' })
  @IsString()
  to: string;

  @ApiProperty({
    example: 'rest_12345',
    description: 'Fleet UID linked to these timings',
    required: false,
  })
  @IsOptional() // ✅ make optional
  @IsString()
  fleetUid?: string; // ✅ optional now
}
