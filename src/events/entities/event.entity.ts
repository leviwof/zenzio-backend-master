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

export enum EventStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  date: string;

  @Column()
  startTime: string; // HH:mm format

  @Column()
  endTime: string; // HH:mm format

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  capacity: number;

  @Column({ default: 1 })
  max_persons: number;

  @Column({ nullable: true })
  image: string;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PENDING,
  })
  status: EventStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'uid' })
  restaurant: Restaurant;

  @Column({ type: 'varchar' })
  restaurant_id: string;
}
