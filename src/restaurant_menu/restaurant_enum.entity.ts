import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('restaurant_enum')
@Unique(['name', 'father_id', 'parent_id']) // ✅ Prevents duplicates in the same hierarchy level
export class RestaurantEnum {
  @ApiProperty({ example: 1, description: 'Unique ID of the enum entry' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'South Indian',
    description: 'Enum name or value (e.g., Cuisine, South Indian, Rotti)',
  })
  @Column({ type: 'varchar' })
  name: string;

  @ApiProperty({ example: 0, description: 'Main category ID (0 for top-level items)' })
  @Column({ type: 'int', default: 0 })
  father_id: number;

  @ApiProperty({ example: 0, description: 'Parent ID (subcategory or item grouping reference)' })
  @Column({ type: 'int', default: 0 })
  parent_id: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  @ApiProperty({ description: 'Record last update timestamp' })
  updatedAt: Date;
}
