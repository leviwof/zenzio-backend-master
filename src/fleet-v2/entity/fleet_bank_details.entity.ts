import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Fleet } from './fleet.entity';

@Entity('fleet_bank_details')
export class FleetBankDetails {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ unique: true })
  fleetUid: string;

  @ManyToOne(() => Fleet, (fleet) => fleet.bank_details, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'fleetUid', referencedColumnName: 'uid' })
  fleet: Fleet;

  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  account_number: string;

  @Column({ nullable: true })
  ifsc_code: string;

  @Column({ nullable: true })
  account_type: string;

  @Column({ nullable: true })
  razorpay_accid: string;

  @Column({ default: false })
  verified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
