import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { FleetContact } from './fleet_contact.entity';
import { Session } from '../../auth/session.entity';
import { ProviderType } from '../../constants/app.enums';
import { FleetAddress } from './fleet_address.entity';
import { FleetProfile } from './fleet_profile.entity';
import { FleetBankDetails } from './fleet_bank_details.entity';
import { WorkingHour } from './working-hour.entity';
import { FleetEmergencyContact } from './fleet_emergency_contact.entity';
import { FleetDocument } from './fleet-document.entity';
// import { FleetEmergencyContact } from './fleet_emergency_contact.entity';
@Entity('fleets')
export class Fleet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uid: string;

  @Column({ nullable: true })
  firebase_uid: string;

  @Column({
    type: 'enum',
    enum: ProviderType as unknown as string[],
  })
  providerType: ProviderType;

  @Column({ nullable: true })
  role: string;

  // 🔥 Previously: status: string  → NOW: boolean
  @Column({ type: 'boolean', default: false })
  status: boolean;

  @Column({ type: 'varchar', nullable: true })
  status_flag: string;

  // AGGREGATED RATINGS
  @Column({ type: 'float', default: 0 })
  rating_sum: number;

  @Column({ type: 'int', default: 0 })
  rating_count: number;

  @Column({ type: 'float', default: 0 })
  rating_avg: number;

  // 🔥 NEW FIELD: Like menu entity
  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  isActive_flag: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'int', default: 0 })
  verificationFlags: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => FleetContact, (contact) => contact.fleet, { cascade: false })
  contact: FleetContact;

  @OneToOne(() => FleetAddress, (address) => address.fleet, { cascade: false })
  address: FleetAddress;

  @OneToOne(() => FleetProfile, (profile) => profile.fleet, { cascade: false })
  profile: FleetProfile;

  @OneToOne(() => FleetBankDetails, (bank) => bank.fleet, { cascade: false })
  bank_details: FleetBankDetails;

  @OneToMany(() => FleetDocument, (doc) => doc.fleet, { cascade: false })
  documents: FleetDocument[];

  @OneToMany(() => Session, (session) => session.fleet)
  sessions: Session[];

  @OneToMany(() => WorkingHour, (hour) => hour.fleet, { cascade: true })
  operational_hours: WorkingHour[];

  @OneToMany(() => FleetEmergencyContact, (emergencyContact) => emergencyContact.fleet, {
    cascade: true,
  })
  emergencyContacts: FleetEmergencyContact[];
}
