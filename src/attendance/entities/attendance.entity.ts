import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { AttendanceLogs } from '../interface/attendance-log.type';

@Entity('fleet_attendance', { synchronize: false })
@Index(['fleet_uid', 'date'], { unique: true })
export class AttendanceEntity {
  @Column({ type: 'varchar' })
  attendance_uid: string;

  //   @Column({ type: 'varchar', unique: true })
  //   attendance_uid: string;

  @PrimaryColumn({ type: 'varchar' })
  fleet_uid: string;

  @PrimaryColumn({ type: 'date' })
  date: string;

  @Column({
    type: 'jsonb',
    default: () => `'{"events": []}'`,
  })
  logs: AttendanceLogs;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Auto UID generation
  @BeforeInsert()
  generateUid() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();

    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    this.attendance_uid = `AT-${yyyy}${mm}${dd}-${random}`;
  }
}
