import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserType {
  USER = 'user',
  RESTAURANT = 'restaurant',
  DELIVERY_PARTNER = 'delivery_partner',
  ADMIN = 'admin',
}

@Entity('fcm_tokens')
@Index(['userType', 'userId'])
export class FcmToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: UserType })
  userType: UserType;

  @Column()
  userId: string; // uid of user/restaurant/delivery partner

  @Column()
  token: string;

  @Column({ nullable: true })
  deviceId: string;

  @Column({ default: 'android' })
  platform: string; // 'android' | 'ios'

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
