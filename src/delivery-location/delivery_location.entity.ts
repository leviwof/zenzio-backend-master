import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  PrimaryColumn,
} from 'typeorm';

export type AddressType = 'primary' | 'home' | 'office' | 'public' | 'guest';

@Entity('delivery_locations')
export class DeliveryLocation {
  @PrimaryColumn({ type: 'varchar', unique: true })
  delivery_uid: string;

  @BeforeInsert()
  generateUid() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    this.delivery_uid = `DL-${code}`;
  }

  @Column({
    type: 'varchar',
    default: 'primary',
  })
  address_type: AddressType;

  @Column()
  user_uid: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  lng: number;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @Column({ type: 'int', default: 0 })
  status: number;

  @Column({ type: 'boolean', default: true })
  verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
