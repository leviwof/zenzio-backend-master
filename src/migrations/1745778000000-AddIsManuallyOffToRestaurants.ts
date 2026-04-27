import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsManuallyOffToRestaurants1745778000000 implements MigrationInterface {
    name = 'AddIsManuallyOffToRestaurants1745778000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "restaurants" 
            ADD COLUMN IF NOT EXISTS "is_manually_off" boolean NOT NULL DEFAULT false
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "restaurants"."is_manually_off" IS 'Restaurant manually turned off by owner'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "restaurants" 
            DROP COLUMN IF EXISTS "is_manually_off"
        `);
    }
}