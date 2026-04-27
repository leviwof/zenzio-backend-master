import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlatformFeePercentToGlobalSettings1745777400000 implements MigrationInterface {
    name = 'AddPlatformFeePercentToGlobalSettings1745777400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "global_settings" 
            ADD COLUMN IF NOT EXISTS "platform_fee_percent" numeric NOT NULL DEFAULT 33
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "global_settings"."platform_fee_percent" IS 'Platform fee percentage applied to menu item prices'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "global_settings" 
            DROP COLUMN IF EXISTS "platform_fee_percent"
        `);
    }
}