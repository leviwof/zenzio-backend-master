import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmergencyAlertStatus } from './emergency-alert-status.enum';
import { EmergencyMeta } from './emergency-meta.interface';

@Entity('emergency_alerts')
export class EmergencyAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  alert_uid: string;

  @Column()
  user_uid: string;

  @Column({ nullable: true })
  fleet_uid: string;

  @Column({ type: 'double precision', nullable: true })
  lat: number;

  @Column({ type: 'double precision', nullable: true })
  lng: number;

  @Column({ type: 'varchar', nullable: true })
  location_address: string;

  @Column({
    type: 'enum',
    enum: EmergencyAlertStatus,
    default: EmergencyAlertStatus.OPEN,
  })
  status: EmergencyAlertStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  meta: EmergencyMeta | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at: Date | null;

  @Column({ type: 'varchar', nullable: true })
  resolved_by_uid: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
