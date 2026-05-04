import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Add order enhancement columns
 *
 * Previously running in orders.service.ts onModuleInit() - moved to proper migration
 * to avoid race conditions in multi-instance deployments.
 */
export class AddOrderEnhancements1777870743526 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add status timeline for tracking order status changes
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN IF NOT EXISTS "status_timeline" jsonb DEFAULT '[]'::jsonb
        `);

        // Add delivery proof photo
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN IF NOT EXISTS "delivery_proof_photo" text
        `);

        // Add admin commission tracking
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN IF NOT EXISTS "admin_commission" float DEFAULT 0
        `);

        // Add packing charge
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN IF NOT EXISTS "packing_charge" float DEFAULT 10
        `);

        // Revenue tracking columns
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN IF NOT EXISTS "is_revenue_counted" boolean DEFAULT false
        `);

        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN IF NOT EXISTS "refunded_amount" float DEFAULT 0
        `);

        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN IF NOT EXISTS "payment_status" varchar(50)
        `);

        // Partner coordinates for tracking
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN IF NOT EXISTS "partner_lat" DECIMAL(10, 7)
        `);

        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN IF NOT EXISTS "partner_lng" DECIMAL(10, 7)
        `);

        // Update estimated time: change 15 min to 5 min for existing orders
        await queryRunner.query(`
            UPDATE "orders"
            SET "estimated_time" = '5 min'
            WHERE "estimated_time" IN ('15 min', '15 mins')
        `);

        // Set default estimated time to 5 min
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "estimated_time" SET DEFAULT '5 min'
        `);

        console.log('✅ [Migration] Order enhancements applied successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert columns (use with caution - data will be lost!)
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "partner_lng"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "partner_lat"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_status"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "refunded_amount"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "is_revenue_counted"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "packing_charge"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "admin_commission"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "delivery_proof_photo"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "status_timeline"`);

        console.log('✅ [Migration] Order enhancements reverted');
    }

}
