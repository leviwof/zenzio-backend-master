import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
} from 'typeorm';

@Entity('restaurant_menus')
export class RestaurantMenu {
  @PrimaryGeneratedColumn()
  id: number;

  // @Column({ type: 'varchar', unique: true })
  // menu_uid: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  menu_uid: string;

  @BeforeInsert()
  generateUid() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < 7; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    this.menu_uid = `MNU-${code}`;
  }

  @Column({ type: 'varchar', nullable: true })
  restaurant_uid: string;

  @Column({ type: 'varchar' })
  menu_name: string;

  @Column({ type: 'varchar', nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal' })
  price: number;

  @Column({ type: 'varchar', nullable: true })
  food_type: string;

  @Column({ type: 'varchar', nullable: true })
  cuisine_type: string;

  @Column({ type: 'boolean', default: false })
  contain_allergence: boolean;

  @Column({ type: 'varchar', nullable: true })
  specify_allergence: string;

  @Column({ type: 'json', nullable: true })
  customized_option: any[];

  @Column({ type: 'json', nullable: true })
  size_option: any[];

  @Column({ type: 'json', nullable: true })
  topping: any[];

  @Column({ type: 'varchar', nullable: true })
  size: string;

  @Column({ type: 'int', default: 1 })
  qty: number;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'int', default: 0 })
  discount: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  orderedCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @Column({ type: 'varchar', nullable: true })
  status_flag: string;

  @Column({ type: 'varchar', nullable: true })
  isActive_flag: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;
}
