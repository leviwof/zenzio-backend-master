import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserContact } from './user_contact.entity';
import { Session } from '../auth/session.entity';
import { ProviderType } from '../constants/app.enums';
import { UserAddress } from './user_address.entity';
import { UserProfile } from './user_profile.entity';
import { BankDetails } from './bank_details.entity';

@Entity('users')
export class User {
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


  @Column({ type: 'boolean', default: false })
  status: boolean;

  @Column({ type: 'varchar', nullable: true })
  status_flag: string;


  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  isActive_flag: string;

  @Column({ type: 'boolean', default: true })
  notificationsEnabled: boolean;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'int', default: 0 })
  verificationFlags: number;

  @Column({ unique: true, nullable: true })
  refer_code: string; // e.g. REF-A3F9K — generated at signup

  @Column({ nullable: true })
  referred_by: string; // refer_code of the user who referred them


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => UserContact, (contact) => contact.user)
  contact: UserContact;

  @OneToOne(() => UserAddress, (address) => address.user)
  address: UserAddress;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @OneToOne(() => BankDetails, (bank_details) => bank_details.user)
  bank_details: BankDetails;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];
}
