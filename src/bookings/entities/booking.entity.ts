import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Restaurant } from '../../restaurants/entity/restaurant.entity';
import { DiningSpace } from './dining-space.entity';
import { Event } from '../../events/entities/event.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  SEATED = 'SEATED',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', nullable: true })
  date: Date;

  @Column()
  guests: number;

  @Column({
    // type: 'enum',
    // enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  specialRequest: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', nullable: true })
  user_id: number;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ type: 'bigint' }) // Use bigint to match Restaurant ID type
  restaurant_id: string;

  @Column({ type: 'varchar', nullable: true })
  bookingTime: string;

  @Column({ type: 'varchar', nullable: true })
  purpose: string;

  @ManyToOne(() => DiningSpace, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'dining_space_id' })
  diningSpace: DiningSpace;

  @Column({ type: 'uuid', nullable: true })
  dining_space_id: string;

  @ManyToOne(() => Event, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'uuid', nullable: true })
  event_id: string;
}
