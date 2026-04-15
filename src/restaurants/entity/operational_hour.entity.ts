import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('operational_hours')
export class OperationalHour {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  // ⭐ UNIQUE CODE LIKE "OPH-ABC123"
  @Column({ type: 'varchar', unique: true })
  hour_uid: string;

  @BeforeInsert()
  generateUid() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    this.hour_uid = `OPH-${code}`;
  }

  @Column()
  day: string;

  @Column({ type: 'boolean' })
  enabled: boolean;

  @Column()
  from: string;

  @Column()
  to: string;

  // FK → Restaurant.uid
  @Column({ type: 'varchar' })
  restaurantUid: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.operational_hours, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantUid', referencedColumnName: 'uid' })
  restaurant: Restaurant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
