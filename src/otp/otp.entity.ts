import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum OtpType {
  REGISTER = 'register',
  LOGIN = 'login',
  VERIFICATION = 'verification',

  RESTAURANT_VERIFY = 'restaurant-verify',
  CUSTOMER_VERIFY = 'customer-verify',
  FLEET_VERIFY = 'fleet-verify',
}

@Entity('otps')
export class OtpEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phone: string;

  @Column()
  otp: string;

  @Column({ type: 'enum', enum: OtpType, nullable: true })
  type: OtpType;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
