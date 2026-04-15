import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

interface PartitionExistsResult {
  exists: boolean;
}

@Injectable()
export class AttendancePartitionCron {
  private readonly logger = new Logger(AttendancePartitionCron.name);

  constructor(
    @Inject(getDataSourceToken())
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async ensureNextMonthPartition(): Promise<void> {
    try {
      const today = new Date();

      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;

      const start = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      const endMonth = nextMonth === 12 ? 1 : nextMonth + 1;
      const endYear = nextMonth === 12 ? nextYear + 1 : nextYear;

      const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

      const partitionName = `fleet_attendance_${nextYear}_${String(nextMonth).padStart(2, '0')}`;

      this.logger.log(`Checking partition: ${partitionName}`);

      // SAFELY TYPE THE QUERY RESULT
      const existsResult = await this.dataSource.query<PartitionExistsResult[]>(
        'SELECT to_regclass($1) IS NOT NULL AS exists',
        [partitionName],
      );

      const exists =
        Array.isArray(existsResult) && existsResult.length > 0 && existsResult[0].exists === true;

      if (exists) {
        this.logger.log(`Partition already exists: ${partitionName}`);
        return;
      }

      const sql = `
        CREATE TABLE ${partitionName}
        PARTITION OF fleet_attendance
        FOR VALUES FROM ('${start}') TO ('${end}');
      `;

      await this.dataSource.query(sql);

      this.logger.log(`Created partition: ${partitionName}`);
    } catch (error) {
      this.logger.error(`Failed to create attendance partition: ${(error as Error).message}`);
    }
  }
}
