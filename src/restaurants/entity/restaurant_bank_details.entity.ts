import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('restaurant_bank_details')
export class RestaurantBankDetails {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', unique: true })
  bank_uid: string; // ✅ NEW UNIQUE UID

  @BeforeInsert()
  generateUid() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    this.bank_uid = `BNK-${code}`;
  }

  @Column({ nullable: true })
  restaurantUid: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.bank_details, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantUid', referencedColumnName: 'uid' })
  restaurant: Restaurant;

  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  account_number: string;

  @Column({ nullable: true })
  ifsc_code: string;

  @Column({ nullable: true })
  account_type: string;

  @Column({ nullable: true })
  razorpay_accid: string;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
