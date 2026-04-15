import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum CouponStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.PERCENTAGE,
  })
  discountType: DiscountType;

  @Column('decimal')
  discountValue: number;

  @Column('decimal')
  minOrderValue: number;

  @Column('decimal', { nullable: true })
  maxDiscountCap: number;

  @Column('int', { nullable: true })
  usageLimit: number;

  @Column('int', { nullable: true })
  usageLimitPerUser: number;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ default: 'all' })
  targetAudience: string;

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.ACTIVE,
  })
  status: CouponStatus;

  @Column('int', { default: 0 })
  redemptionCount: number;

  @Column({ nullable: true })
  assigned_to_uid: string; // if set, ONLY this user can apply the coupon

  @Column({ nullable: true, default: null })
  source: string; // 'referral_joinee' | 'referral_reward' | null


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
