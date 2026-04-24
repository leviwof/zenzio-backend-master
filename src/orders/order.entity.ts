// File: src/orders/order.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderId: string;

  // price in the smallest currency unit or as number (e.g., 430 for ₹430)
  @Column({ type: 'float', default: 0 })
  price: number;

  @Column()
  time: string; // ISO string

  @Column()
  customer: string; // user_uid from user_contacts

  @Column({ nullable: true })
  restaurant_uid: string;

  @Column({ nullable: true })
  delivery_partner_uid: string;

  @Column({ type: 'json', default: [] })
  items: any;

  // General order status: 'new', 'processing', 'completed', 'cancelled'
  @Column({ default: 'new' })
  status: string;

  // Restaurant-side status: 'new', 'accepted', 'ready', 'rejected'
  @Column({ default: 'new' })
  restaurantStatus: string;

  // Delivery partner status: 'pending', 'accepted', 'picked_up', 'delivered'
  @Column({ default: 'pending' })
  deliveryPartnerStatus: string;

  // ✅ NEW: User OTP for delivery verification (4-digit code)
  @Column({ nullable: true })
  user_otp: string;

  // ✅ NEW: Item total (sum of items without delivery/taxes)
  @Column({ type: 'float', default: 0 })
  item_total: number;

  // ✅ NEW: Delivery fee (calculated based on distance)
  @Column({ type: 'float', default: 0 })
  delivery_fee: number;

  // ✅ NEW: Taxes (5% of item_total)
  @Column({ type: 'float', default: 0 })
  taxes: number;

  // ✅ NEW: Admin Commission (8% of item_total)
  @Column({ type: 'float', default: 0 })
  admin_commission: number;

  // ✅ NEW: Packing Charges (Fixed ₹10)
  @Column({ type: 'float', default: 10 })
  packing_charge: number;

  // ✅ NEW: Delivery address (full address string)
  @Column({ type: 'text', nullable: true })
  delivery_address: string;

  // ✅ NEW: Restaurant coordinates for distance calculation
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  restaurant_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  restaurant_lng: number;

  // ✅ NEW: Customer coordinates for distance calculation
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  customer_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  customer_lng: number;

  // ✅ NEW: Distance in km (stored for reference)
  @Column({ type: 'float', nullable: true })
  distance_km: number;

  // ✅ NEW: Live Delivery Partner Location
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  delivery_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  delivery_lng: number;

  // ✅ NEW: Payment mode (cod/online)
  @Column({ nullable: true })
  payment_mode: string;

  // ✅ NEW: Estimated preparation/delivery time set by restaurant
  @Column({ nullable: true, default: '5 min' })
  estimated_time: string;

  // ✅ NEW: Razorpay Order ID to link payment
  @Column({ nullable: true })
  razorpay_order_id: string;

  // ✅ NEW: Delivery notes from partner
  @Column({ type: 'text', nullable: true })
  notes: string;

  // ✅ NEW: Applied Coupon Code
  @Column({ nullable: true })
  coupon_code: string;

  // ✅ NEW: Discount amount from coupon
  @Column({ type: 'float', default: 0 })
  coupon_discount: number;

  // ✅ NEW: Delivery Proof Photo URL (S3/CDN)
  @Column({ type: 'text', nullable: true })
  delivery_proof_photo: string;

  // ✅ NEW: Status timeline to track status changes with timestamps
  @Column({ type: 'json', nullable: true, default: [] })
  status_timeline: Array<{
    status: string;
    timestamp: string;
    message: string;
    updatedBy?: string;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isRevenueCounted: boolean;

  @Column({ type: 'float', default: 0 })
  refundedAmount: number;

  @Column({ nullable: true })
  paymentStatus: string;
}
