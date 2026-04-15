import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';

@Entity('cart_groups')
export class CartGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  cart_group_uid: string;

  @ManyToOne(() => Cart, (cart) => cart.groups, { onDelete: 'CASCADE' })
  cart: Cart;

  @Column()
  restaurant_uid: string;

  @Column({ nullable: true, default: null })
  user_uid: string;

  @Column({ nullable: true, default: null })
  fleet_uid: string;

  /** Subtotal = sum of item prices */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  /** Items in the group */
  @OneToMany(() => CartItem, (item) => item.group, { cascade: true })
  items: CartItem[];

  /** Number of unique items */
  @Column({ type: 'int', default: 0 })
  item_count: number;

  /** Sum of all item qty */
  @Column({ type: 'int', default: 0 })
  total_item_qty: number;

  /** Subtotal + delivery + tax */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  grand_total: number;

  @Column({ type: 'varchar', length: 10, default: 'NONE' })
  pay_mode: 'COD' | 'ONLINE' | 'NONE';

  @Column({ nullable: true })
  raz_ord_id: string;

  @Column({ nullable: true })
  raz_pay_id: string;

  @Column({ nullable: true })
  raz_refund_req_id: string;

  @Column({ nullable: true })
  raz_refund_success_id: string;

  @Column({ type: 'varchar', length: 100, default: '0' })
  pay_status: string;

  @Column({ type: 'varchar', length: 100, nullable: true, default: '0' })
  pay_status_flag: string;

  @Column({ type: 'varchar', length: 10, default: '0' })
  status: string;

  @Column({ type: 'varchar', length: 10, default: '0' })
  f_status: string;

  @Column({ type: 'varchar', length: 10, default: '0' })
  r_status: string;

  @Column({ type: 'varchar', length: 10, default: '0' })
  m_status: string;

  @Column({ nullable: true })
  status_flag: string;

  @Column({ nullable: true })
  f_status_flag: string;

  @Column({ nullable: true })
  r_status_flag: string;

  @Column({ nullable: true })
  m_status_flag: string;

  @Column({ nullable: true })
  f_ticket_id: string;

  @Column({ nullable: true })
  r_ticket_id: string;

  @Column({ nullable: true })
  c_ticket_id: string;

  @Column({
    type: 'varchar',
    default: 'primary',
  })
  address_type: 'primary' | 'home' | 'office' | 'public' | 'guest';

  /**
   * ✅ NEW — Logs for status flow history
   * Each log entry: { code: string, timestamp: string }
   */
  @Column({ type: 'jsonb', default: () => `'[]'` })
  logs: { code: string; desc: string; timestamp: string }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateUid() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 7; i++) code += chars[Math.floor(Math.random() * chars.length)];
    this.cart_group_uid = `CG-${code}`;
  }
}
