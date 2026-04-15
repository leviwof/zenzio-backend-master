import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity('super_admin') // <-- Changed here: no dash!
export class SuperAdmin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, update: false })
  uid: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  photo?: string;

  @Column({
    type: 'varchar',
    default: 'password',
  })
  providerType: string;

  @Column({
    type: 'varchar',
  })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  otp_code: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otp_expiry: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
