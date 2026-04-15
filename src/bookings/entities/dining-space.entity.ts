import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from '../../restaurants/entity/restaurant.entity';
import { Offer } from '../../offers/offers.entity';

@Entity('dining_spaces')
export class DiningSpace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  restaurantId: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId', referencedColumnName: 'uid' })
  restaurant: Restaurant;

  @Column()
  areaName: string;

  @Column('int')
  seatingCapacity: number;

  @Column({ nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  photoUrls: string[];

  @Column({ nullable: true })
  bookingTimeSlot: string;

  @Column({ nullable: true })
  offerId: string;

  @ManyToOne(() => Offer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'offerId' })
  offer: Offer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
