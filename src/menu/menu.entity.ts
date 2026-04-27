import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('menu')
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dishName: string;

  @Column({ type: 'text', nullable: true })
  dishDescription?: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  cuisineType?: string;

  @Column({ default: false })
  vegetarian: boolean;

  @Column({ default: false })
  containsAllergens: boolean;

  @Column({ type: 'text', nullable: true })
  allergens?: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  imageUrl?: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  customizationOptions: any[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
