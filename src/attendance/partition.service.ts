import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PartitionService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.createParentTable();

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    await this.createMonthlyPartition(year, month); // current month
    await this.createMonthlyPartition(year, month + 1); // next month

    console.log('✅ Attendance partition setup complete.');
  }

  // -------------------------------------------
  // CREATE PARENT TABLE
  // -------------------------------------------
  async createParentTable() {
    await this.dataSource.query(`
  CREATE TABLE IF NOT EXISTS fleet_attendance (
    attendance_uid varchar,
    fleet_uid varchar NOT NULL,
    date date NOT NULL,
    logs jsonb DEFAULT '{"events": []}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (fleet_uid, date)
  ) PARTITION BY RANGE (date);
`);
  }

  // -------------------------------------------
  // CREATE MONTHLY PARTITION
  // -------------------------------------------
  async createMonthlyPartition(year: number, month: number) {
    if (month === 13) {
      year += 1;
      month = 1;
    }

    const start = `${year}-${String(month).padStart(2, '0')}-01`;

    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth === 13) {
      nextMonth = 1;
      nextYear = year + 1;
    }
    const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const tableName = `fleet_attendance_${year}_${String(month).padStart(2, '0')}`;

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${tableName}
      PARTITION OF fleet_attendance
      FOR VALUES FROM ('${start}') TO ('${end}');
    `);
  }
}
