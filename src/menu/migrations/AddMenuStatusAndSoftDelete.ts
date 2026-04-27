import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMenuStatusAndSoftDelete1720000000000 implements MigrationInterface {
  name = 'AddMenuStatusAndSoftDelete1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "menu" 
      ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP
    `);

    await queryRunner.query(`
      UPDATE "menu" SET "is_active" = true WHERE "is_active" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "menu" 
      DROP COLUMN IF EXISTS "is_active",
      DROP COLUMN IF EXISTS "deleted_at"
    `);
  }
}