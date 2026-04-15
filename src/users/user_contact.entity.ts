import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_contacts')
@Unique(['encryptedEmail'])
@Unique(['encryptedPhone'])
@Unique(['encryptedUsername'])
export class UserContact {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.contact, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userUid', referencedColumnName: 'uid' })
  user: User;

  @Column({ unique: true })
  userUid: string;

  @Column({ unique: true, nullable: true })
  encryptedEmail: string;

  @Column({ unique: true, nullable: true })
  encryptedPhone: string;

  @Column({ unique: true, nullable: true })
  encryptedUsername: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
