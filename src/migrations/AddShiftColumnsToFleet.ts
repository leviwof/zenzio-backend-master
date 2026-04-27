import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShiftColumnsToFleet1714060800000 implements MigrationInterface {
  name = 'AddShiftColumnsToFleet1714060800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fleets" 
      ADD COLUMN IF NOT EXISTS "shift_id" VARCHAR,
      ADD COLUMN IF NOT EXISTS "shift_locked" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "shift_assigned_at" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fleets" 
      DROP COLUMN IF EXISTS "shift_id",
      DROP COLUMN IF EXISTS "shift_locked",
      DROP COLUMN IF EXISTS "shift_assigned_at"
    `);
  }
}