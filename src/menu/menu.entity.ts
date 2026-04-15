import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('menu')
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dishName: string;

  @Column({ type: 'text', nullable: true })
  dishDescription?: string;

  // use 'decimal' (TypeORM) / numeric (Postgres) for monetary values
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

  // <<< IMPORTANT: explicitly set DB type to varchar (string)
  // Note: keep the TS type as string (not a union) so reflect-metadata reports String.
  @Column({ type: 'varchar', length: 1024, nullable: true })
  imageUrl?: string; // use optional string instead of `string | null`

  // For Postgres prefer jsonb
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  customizationOptions: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
