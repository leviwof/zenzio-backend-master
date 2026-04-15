import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  BeforeInsert,
  JoinColumn,
} from 'typeorm';
import { CartGroup } from './cart-group.entity';
import { RestaurantMenu } from '../../restaurant_menu/restaurant_menu.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  cart_item_uid: string;

  @ManyToOne(() => CartGroup, (group) => group.items, { onDelete: 'CASCADE' })
  group: CartGroup;

  @Column()
  menu_uid: string;

  @ManyToOne(() => RestaurantMenu)
  @JoinColumn({ name: 'menu_uid', referencedColumnName: 'menu_uid' })
  menu?: RestaurantMenu;

  @Column()
  menu_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 1 })
  qty: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_price: number;

  // VIRTUAL FIELD
  // images?: string[];

  @BeforeInsert()
  generateUid() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 7; i++) code += chars[Math.floor(Math.random() * chars.length)];
    this.cart_item_uid = `CITEM-${code}`;
  }
}
