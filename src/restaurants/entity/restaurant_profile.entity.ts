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

@Entity('restaurant_profile')
export class RestaurantProfile {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column()
  restaurantUid: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.profile, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantUid', referencedColumnName: 'uid' })
  restaurant: Restaurant;

  @Column({ nullable: true })
  restaurant_name: string;

  @Column({ nullable: true })
  contact_person: string;

  @Column({ nullable: true })
  contact_number: string;

  @Column({ nullable: true })
  contact_email: string;

  @Column({ nullable: true })
  avg_cost_for_two: string;

  @Column({ nullable: true, default: 'non_veg' })
  food_type: string;

  @Column({ type: 'json', nullable: true })
  photo: string[];

  @Column({ type: 'decimal', nullable: true, default: 0 })
  packing_charge: number;

  @Column({ nullable: true })
  razorpay_contact_id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
