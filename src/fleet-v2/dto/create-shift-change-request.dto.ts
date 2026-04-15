import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShiftChangeRequestDto {
    @ApiProperty({ example: 'WT-ABC12345', description: 'Requested work type UID' })
    @IsNotEmpty()
    @IsString()
    requested_work_type_uid: string;

    @ApiProperty({ example: 'Need to change shift for personal reasons', required: false })
    @IsOptional()
    @IsString()
    reason?: string;
}
