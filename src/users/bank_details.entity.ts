import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity('bank_details')
export class BankDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.bank_details, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  ifsc_code: string;

  @Column({ nullable: true })
  account_number: string;

  @Column({ nullable: true })
  account_type: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
