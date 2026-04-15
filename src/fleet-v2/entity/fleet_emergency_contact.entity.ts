import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Fleet } from './fleet.entity';

@Entity('fleet_emergency_contacts')
@Entity('fleet_emergency_contacts')
export class FleetEmergencyContact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contact_person: string;

  @Column()
  relationship: string;

  @Column({ default: false })
  primary_contact: boolean;

  @Column({ default: false })
  secondary_contact: boolean;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  pincode: string;

  @ManyToOne(() => Fleet, (fleet) => fleet.emergencyContacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fleetUid', referencedColumnName: 'uid' }) // ✅ FIX
  fleet: Fleet;

  @Column()
  fleetUid: string; // FK to Fleet.uid (string)
}
