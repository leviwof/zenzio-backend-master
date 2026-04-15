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

@Entity('fleet_documents')
export class FleetDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fleetUid: string;

  @ManyToOne(() => Fleet, (fleet) => fleet.documents, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'fleetUid', referencedColumnName: 'uid' })
  fleet: Fleet;

  // ----------------------------
  // PERSONAL DOCUMENT NUMBERS
  // ----------------------------
  @Column({ nullable: true })
  aadharNumber?: string;

  @Column({ nullable: true })
  licenseNumber?: string;

  // ----------------------------
  // VEHICLE DETAILS
  // ----------------------------
  @Column({ nullable: true })
  vehicle_type?: string;

  @Column({ nullable: true })
  registrationNumber?: string;

  @Column({ nullable: true })
  model?: string;

  @Column({ nullable: true })
  vehicleColor?: string;

  @Column({ nullable: true })
  insuranceNo?: string;

  @Column({ nullable: true })
  engineNo?: string;

  @Column({ nullable: true })
  frameNo?: string;

  // ----------------------------
  // DOCUMENT FILE URLs
  // ----------------------------
  @Column({ type: 'jsonb', nullable: true })
  file_insurance?: string[];

  @Column({ type: 'jsonb', nullable: true })
  file_aadhar?: string[];

  @Column({ type: 'jsonb', nullable: true })
  file_pan?: string[];

  @Column({ type: 'jsonb', nullable: true })
  file_rc?: string[];

  @Column({ type: 'jsonb', nullable: true })
  file_other?: string[];

  // ----------------------------
  // TIMESTAMPS
  // ----------------------------
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
