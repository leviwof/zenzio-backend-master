import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('restaurant_address')
export class RestaurantAddress {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column()
  restaurantUid: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.address, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantUid', referencedColumnName: 'uid' })
  restaurant: Restaurant;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  pincode: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng: number;

  @Column({ nullable: true })
  land_mark: string;

  // 👉 NEW FIELD
  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
