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
import { Fleet } from './fleet.entity';
import { WorkType } from '../../work-type/work-type.entity';

@Entity('fleet_profile')
export class FleetProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fleetUid: string;

  @ManyToOne(() => Fleet, (fleet) => fleet.profile, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'fleetUid', referencedColumnName: 'uid' })
  fleet: Fleet;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ type: 'jsonb', nullable: true })
  photo: string[];

  @Column({ type: 'date', nullable: true })
  dob: string;

  @Column({ type: 'varchar', length: 7, unique: true, nullable: true })
  referral_code: string;

  @Column({ nullable: true })
  razorpay_contact_id: string;

  @BeforeInsert()
  generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < 7; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    this.referral_code = code;
  }

  @Column({ nullable: true })
  work_type_uid: string;

  @ManyToOne(() => WorkType, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'work_type_uid', referencedColumnName: 'work_type_uid' })
  work_type: WorkType;

  @Column({ type: 'time', nullable: true })
  start_time: string;

  @Column({ type: 'time', nullable: true })
  end_time: string;

  @Column({ type: 'time', nullable: true })
  break_start_time: string;

  @Column({ type: 'time', nullable: true })
  break_end_time: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
