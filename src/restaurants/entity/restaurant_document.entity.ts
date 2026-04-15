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

@Entity('restaurant_documents')
export class RestaurantDocument {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ nullable: true })
  restaurantUid: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.documents, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantUid', referencedColumnName: 'uid' })
  restaurant: Restaurant;

  // ============================================================
  // FSSAI
  // ============================================================
  @Column({ nullable: true })
  fssai_number?: string;

  @Column({ type: 'jsonb', nullable: true })
  file_fssai?: string[]; // Multiple uploaded docs

  // ============================================================
  // GST
  // ============================================================
  @Column({ nullable: true })
  gst_number?: string;

  @Column({ type: 'jsonb', nullable: true })
  file_gst?: string[];

  // ============================================================
  // TRADE LICENSE
  // ============================================================
  @Column({ nullable: true })
  trade_license_number?: string;

  @Column({ type: 'jsonb', nullable: true })
  file_trade_license?: string[];

  // ============================================================
  // OTHER DOCUMENTS
  // ============================================================
  @Column({ nullable: true })
  otherDocumentType?: string;

  @Column({ type: 'jsonb', nullable: true })
  file_other_doc?: string[];

  // ============================================================
  // AUDIT
  // ============================================================
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
