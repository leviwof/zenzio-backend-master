import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert } from 'typeorm';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ unique: true })
  rating_uid: string; // RAT-XXXXXXX

  @Column({ type: 'varchar', nullable: true })
  group_id: string; // Deprecated in favor of order_id for new flow

  @Column({ unique: true, nullable: true })
  order_id: string; // The specific Order ID

  @Column({ nullable: true })
  restaurant_id: string; // The Restaurant UID

  @Column({ nullable: true })
  driver_id: string; // The Fleet/Driver UID

  // ============================
  // RATING FIELDS + DESCRIPTION
  // ============================

  @Column({ type: 'int', default: 0 })
  cust_restaurant: number;

  @Column({ type: 'varchar', nullable: true })
  cust_restaurant_desc: string | null;

  @Column({ type: 'int', default: 0 })
  cust_fleet: number;

  @Column({ type: 'varchar', nullable: true })
  cust_fleet_desc: string | null;

  @Column({ type: 'int', default: 0 })
  fleet_cust: number;

  @Column({ type: 'varchar', nullable: true })
  fleet_cust_desc: string | null;

  @Column({ type: 'int', default: 0 })
  fleet_rest: number;

  @Column({ type: 'varchar', nullable: true })
  fleet_rest_desc: string | null;

  @Column({ type: 'int', default: 0 })
  rest_fleet: number;

  @Column({ type: 'varchar', nullable: true })
  rest_fleet_desc: string | null;

  @Column({ type: 'int', default: 0 })
  rest_cust: number;

  @Column({ type: 'varchar', nullable: true })
  rest_cust_desc: string | null;

  @Column({ type: 'int', default: 0 })
  cus_app: number;

  @Column({ type: 'varchar', nullable: true })
  cus_app_desc: string | null;

  @Column({ type: 'int', default: 0 })
  rest_app: number;

  @Column({ type: 'varchar', nullable: true })
  rest_app_desc: string | null;

  @Column({ type: 'int', default: 0 })
  fleet_app: number;

  @Column({ type: 'varchar', nullable: true })
  fleet_app_desc: string | null;

  // ============================
  // UID GENERATOR
  // ============================

  @BeforeInsert()
  generateUid() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    this.rating_uid = `RAT-${code}`;
  }
}
