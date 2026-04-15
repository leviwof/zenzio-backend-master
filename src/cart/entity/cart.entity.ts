import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartGroup } from './cart-group.entity';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  cart_uid: string;

  @Column()
  user_uid: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  grand_total: number;

  @Column({ type: 'int', default: 0 }) // 0 = pending, 1 = success
  pay_status: number; //verified

  //   @Column({ type: 'int', default: 0 }) → general cart status
  //   status: number;

  //   @Column({ nullable: true })
  //   status_flag: string;

  @OneToMany(() => CartGroup, (group) => group.cart, { cascade: true })
  groups: CartGroup[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateUid() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    this.cart_uid = `CART-${code}`;
  }
}
