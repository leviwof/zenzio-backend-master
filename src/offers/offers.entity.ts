import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from '../restaurants/entity/restaurant.entity';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  restaurantId: string;

  @ManyToOne(() => Restaurant, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'restaurantId', referencedColumnName: 'uid' })
  restaurant: Restaurant;

  @Column({ nullable: true })
  categoryId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  discountType: 'PERCENTAGE' | 'FLAT';

  @Column('decimal')
  discountValue: number;

  @Column('decimal', { nullable: true })
  minOrderValue: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ nullable: true })
  startTime: string;

  @Column({ nullable: true })
  endTime: string;

  @Column({ type: 'json', nullable: true })
  applicableItems: string[];

  @Column({ nullable: true })
  termsConditions: string;

  @Column({ nullable: true })
  offerImage: string;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

  @Column({ default: false })
  createdByAdmin: boolean;

  @Column({ nullable: true })
  adminComments: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ default: false })
  isCommissionAuto: boolean;

  @Column('decimal', { default: 15 })
  adminCommission: number;

  @CreateDateColumn()
  createdAt: Date;
}
