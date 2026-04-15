import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';

@Entity('work_types')
export class WorkType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  work_type_uid: string;

  @BeforeInsert()
  generateUid() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    this.work_type_uid = `WT-${code}`;
  }

  @Column()
  name: string; // Full-Time, Part-Time, Ultra Full-Time etc.

  @Column({ type: 'time', nullable: true })
  start_time: string;

  @Column({ type: 'time', nullable: true })
  end_time: string;

  @Column({ type: 'time', nullable: true })
  break_start_time: string;

  @Column({ type: 'time', nullable: true })
  break_end_time: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
