import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Fleet } from './fleet.entity';

@Entity('fleet_contacts')
@Unique(['encryptedEmail'])
@Unique(['encryptedPhone'])
@Unique(['encryptedUsername'])
export class FleetContact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fleetUid: string;

  @ManyToOne(() => Fleet, (fleet) => fleet.contact, {
    onDelete: 'RESTRICT', // 🚫 Restrict delete
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'fleetUid', referencedColumnName: 'uid' })
  fleet: Fleet;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  encryptedEmail: string;

  @Column({ nullable: true })
  encryptedPhone: string;

  @Column({ nullable: true })
  encryptedUsername: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
