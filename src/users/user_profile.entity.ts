import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_profile')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userUid', referencedColumnName: 'uid' })
  user: User;

  // Auto-mapped from JoinColumn
  @Column()
  userUid: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ type: 'jsonb', nullable: true })
  photo: string[];

  @Column({ type: 'date', nullable: true })
  dob: Date | null;

  @Column({ type: 'date', nullable: true })
  anniversary: Date | null;

  @Column({ type: 'boolean', default: false })
  tnc_accepted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
