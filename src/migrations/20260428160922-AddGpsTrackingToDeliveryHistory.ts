import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGpsTrackingToDeliveryHistory20260428160922 implements MigrationInterface {
  name = 'AddGpsTrackingToDeliveryHistory20260428160922';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "delivery_history"
      ADD COLUMN IF NOT EXISTS "last_lat" decimal(10,7),
      ADD COLUMN IF NOT EXISTS "last_lng" decimal(10,7),
      ADD COLUMN IF NOT EXISTS "trip_started_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "trip_ended_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "total_distance_km" decimal(10,2) DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "delivery_history"
      DROP COLUMN IF EXISTS "last_lat",
      DROP COLUMN IF EXISTS "last_lng",
      DROP COLUMN IF EXISTS "trip_started_at",
      DROP COLUMN IF EXISTS "trip_ended_at",
      DROP COLUMN IF EXISTS "total_distance_km"
    `);
  }
}
