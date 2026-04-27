import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminUpdateShiftDto {
  @ApiProperty({ example: 'user123', description: 'Fleet user UID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'EVENING', description: 'New Shift ID', required: false })
  @IsString()
  @IsOptional()
  shiftId?: string;

  @ApiProperty({ example: false, description: 'Lock/unlock shift assignment', required: false })
  @IsBoolean()
  @IsOptional()
  locked?: boolean;
}