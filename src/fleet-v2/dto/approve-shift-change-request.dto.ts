import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShiftChangeRequestStatus } from '../entity/shift-change-request.entity';

export class ApproveShiftChangeRequestDto {
    @ApiProperty({ enum: ShiftChangeRequestStatus, example: 'approved' })
    @IsEnum(ShiftChangeRequestStatus)
    status: ShiftChangeRequestStatus;

    @ApiProperty({ example: 'Approved for next month', required: false })
    @IsOptional()
    @IsString()
    admin_notes?: string;
}
