import { IsBoolean, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMenuStatusDto {
  @ApiProperty({ example: true, description: 'Menu active status' })
  @IsBoolean()
  isActive: boolean;
}

export class BulkUpdateStatusDto {
  @ApiProperty({ example: ['uuid1', 'uuid2'], description: 'Array of menu IDs' })
  @IsArray()
  @IsNotEmpty()
  ids: string[];

  @ApiProperty({ example: true, description: 'Status to set' })
  @IsBoolean()
  isActive: boolean;
}

export class BulkDeleteDto {
  @ApiProperty({ example: ['uuid1', 'uuid2'], description: 'Array of menu IDs to delete' })
  @IsArray()
  @IsNotEmpty()
  ids: string[];
}