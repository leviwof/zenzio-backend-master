import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { RestaurantContact } from './restaurant_contact.entity';
import { Session } from '../../auth/session.entity';
import { ProviderType } from '../../constants/app.enums';
import { RestaurantAddress } from './restaurnat_address.entity';
import { RestaurantProfile } from './restaurant_profile.entity';
import { RestaurantBankDetails } from './restaurant_bank_details.entity';
import { RestaurantDocument } from './restaurant_document.entity';
import { OperationalHour } from './operational_hour.entity';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({
    type: 'varchar',
    unique: true,
  })
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

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'int', default: 0 })
  verificationFlags: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'enum', enum: ['open', 'closed'], default: 'closed' })
  isActive_flag: string;

  @Column({ type: 'varchar', default: 'initial' })
  status_flag: string;

  @OneToOne(() => RestaurantContact, (contact) => contact.restaurant, {
    cascade: false,
  })
  contact: RestaurantContact;

  @OneToOne(() => RestaurantAddress, (address) => address.restaurant, {
    cascade: false,
  })
  address: RestaurantAddress;

  @OneToOne(() => RestaurantProfile, (profile) => profile.restaurant, {
    cascade: false,
  })
  profile: RestaurantProfile;

  @OneToOne(() => RestaurantBankDetails, (bank) => bank.restaurant, {
    cascade: false,
  })
  bank_details: RestaurantBankDetails;

  @OneToMany(() => RestaurantDocument, (doc) => doc.restaurant, {
    cascade: false,
  })
  documents: RestaurantDocument[];

  @OneToMany(() => Session, (session) => session.restaurant)
  sessions: Session[];

  @OneToMany(() => OperationalHour, (hour) => hour.restaurant, {
    cascade: true,
  })
  operational_hours: OperationalHour[];

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  deliveryRadius: number;

  @Column({ type: 'boolean', default: true })
  isDiningEnabled: boolean;

  @Column({ type: 'float', default: 0 })
  rating_sum: number;

  @Column({ type: 'int', default: 0 })
  rating_count: number;

  @Column({ type: 'float', default: 0 })
  rating_avg: number;
}
