import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Fleet } from './fleet.entity';

export enum DeliveryStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  ARRIVED_AT_RESTAURANT = 'arrived_at_restaurant',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  ARRIVED_AT_LOCATION = 'arrived_at_location',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('delivery_history')
export class DeliveryHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uid: string;

  // Reference to the order
  @Column()
  order_id: string;

  @Column({ nullable: true })
  order_number: string;

  // Delivery partner info
  @Column()
  fleet_uid: string;

  @ManyToOne(() => Fleet, { nullable: true })
  @JoinColumn({ name: 'fleet_uid', referencedColumnName: 'uid' })
  fleet: Fleet;

  // Restaurant info
  @Column({ nullable: true })
  restaurant_uid: string;

  @Column({ nullable: true })
  restaurant_name: string;

  @Column({ nullable: true })
  restaurant_address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  restaurant_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  restaurant_lng: number;

  // Customer info
  @Column({ nullable: true })
  customer_uid: string;

  @Column({ nullable: true })
  customer_name: string;

  @Column({ nullable: true })
  customer_phone: string;

  @Column({ nullable: true })
  customer_address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  customer_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  customer_lng: number;

  // Financial info
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  order_value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  delivery_earning: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tip_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_earning: number;

  // Delivery details
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distance_km: number;

  // Real GPS tracking fields
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  last_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  last_lng: number;

  @Column({ type: 'timestamp', nullable: true })
  trip_started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  trip_ended_at: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_distance_km: number;

  @Column({ type: 'int', nullable: true })
  estimated_time_min: number;

  @Column({ type: 'int', nullable: true })
  actual_time_min: number;

  // OTP verification
  @Column({ nullable: true })
  delivery_otp: string;

  @Column({ type: 'boolean', default: false })
  otp_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  otp_verified_at: Date;

  // Status tracking
  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @Column({ type: 'json', default: [] })
  status_history: {
    status: string;
    timestamp: string;
    notes?: string;
  }[];

  // Timestamps
  @Column({ type: 'timestamp', nullable: true })
  accepted_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  picked_up_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date;

  // Order items (JSON)
  @Column({ type: 'json', default: [] })
  items: any[];

  // Additional notes
  @Column({ type: 'text', nullable: true })
  delivery_notes: string;

  // Proof of delivery
  @Column({ nullable: true })
  delivery_photo_url: string;

  // Payment method
  @Column({ default: 'prepaid' })
  payment_method: string;

  @Column({ type: 'boolean', default: false })
  payment_collected: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
