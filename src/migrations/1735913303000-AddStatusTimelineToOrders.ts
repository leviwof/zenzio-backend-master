import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusTimelineToOrders1735913303000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add status_timeline column to orders table if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "orders" 
      ADD COLUMN IF NOT EXISTS "status_timeline" jsonb DEFAULT '[]'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders" 
      DROP COLUMN IF EXISTS "status_timeline"
    `);
  }
}
