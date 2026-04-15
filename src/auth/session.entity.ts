import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/entity/restaurant.entity';
import { Fleet } from '../fleet-v2/entity/fleet.entity';
// import { Fleet } from 'src/fleet/fleet.entity';
// Fleet

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  // ---------------------------------------
  // ✅ USER RELATION
  // ---------------------------------------
  @Column({ nullable: true })
  userUid?: string; // 🔹 new UID field

  @ManyToOne(() => User, (user) => user.sessions, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userUid', referencedColumnName: 'uid' })
  user?: User;

  // (optional legacy field for old data)
  @Column({ nullable: true })
  userId?: number;

  // ---------------------------------------
  // ✅ RESTAURANT RELATION
  // ---------------------------------------
  @Column({ nullable: true })
  restaurantUid?: string; // 🔹 new UID field

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.sessions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantUid', referencedColumnName: 'uid' })
  restaurant?: Restaurant;

  // (optional legacy field)
  @Column({ nullable: true })
  restaurantId?: string;

  // ---------------------------------------
  // ✅ FLEET RELATION
  // ---------------------------------------
  @Column({ nullable: true })
  fleetUid?: string; // 🔹 new UID field

  @ManyToOne(() => Fleet, (fleet) => fleet.sessions, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fleetUid', referencedColumnName: 'uid' })
  fleet?: Fleet;

  // (optional legacy field)
  @Column({ nullable: true })
  fleetId?: number;

  // ---------------------------------------
  // ✅ COMMON SESSION FIELDS
  // ---------------------------------------
  @Column({ unique: true })
  refreshToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
