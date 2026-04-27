import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignShiftDto {
  @ApiProperty({ example: 'user123', description: 'Fleet user UID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'MORNING', description: 'Shift ID from predefined shifts' })
  @IsString()
  @IsNotEmpty()
  shiftId: string;
}