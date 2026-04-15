import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OperationalHourDto {
  @ApiProperty({ example: 'Mon', description: 'Day of the week' })
  @IsString()
  day: string;

  @ApiProperty({ example: true, description: 'Whether restaurant is open on this day' })
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
    description: 'Restaurant UID linked to these timings',
    required: false,
  })
  @IsOptional()
  @IsString()
  restaurantUid?: string;
}

export class UpdateOperationalHoursDto {
  @ApiProperty({ type: [OperationalHourDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperationalHourDto)
  operationalHours: OperationalHourDto[];
}
