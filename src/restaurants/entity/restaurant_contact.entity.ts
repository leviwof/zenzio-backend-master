import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('restaurant_contacts')
@Unique(['encryptedEmail'])
@Unique(['encryptedPhone'])
@Unique(['encryptedUsername'])
export class RestaurantContact {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'uuid' })
  restaurantUid: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.contact, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantUid', referencedColumnName: 'uid' })
  restaurant: Restaurant;

  @Column({ nullable: true })
  encryptedEmail: string;

  @Column({ nullable: true })
  encryptedPhone: string;

  @Column({ nullable: true })
  encryptedUsername: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
