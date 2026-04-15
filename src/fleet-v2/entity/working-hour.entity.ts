// import { Fleet } from 'src/fleet/fleet.entity';
// Fleet
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Fleet } from './fleet.entity';

@Entity('fleet_working_hours')
export class WorkingHour {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  day: string;

  @Column({ default: true })
  enabled: boolean;

  @Column()
  from: string;

  @Column()
  to: string;

  // ✅ Explicit fleetUid field
  @Column({ nullable: false })
  fleetUid: string;

  // ✅ Relation for cascade & ORM joins

  @ManyToOne(() => Fleet, (fleet) => fleet.operational_hours, {
    onDelete: 'CASCADE',
  })
  fleet: Fleet;
}
