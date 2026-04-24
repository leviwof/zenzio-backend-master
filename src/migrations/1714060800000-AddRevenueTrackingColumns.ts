import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRevenueTrackingColumns1714060800000 implements MigrationInterface {
  name = 'AddRevenueTrackingColumns1714060800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "is_revenue_counted" boolean DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refunded_amount" float DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" varchar(50)
    `);
    
    await queryRunner.query(`
      UPDATE "orders" 
      SET "payment_status" = 'success'
      WHERE "payment_mode" = 'ONLINE' 
        AND "restaurantStatus" NOT IN ('cancelled', 'rejected')
        AND "deliveryPartnerStatus" NOT IN ('cancelled', 'admin_cancelled')
    `);
    
    await queryRunner.query(`
      UPDATE "orders" 
      SET "is_revenue_counted" = true 
      WHERE "payment_mode" = 'ONLINE' 
        AND "payment_status" = 'success'
    `);
    
    await queryRunner.query(`
      UPDATE "orders" 
      SET "is_revenue_counted" = true 
      WHERE "payment_mode" = 'COD' 
        AND "deliveryPartnerStatus" = 'delivered'
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_orders_revenue_lookup" 
      ON "orders" ("payment_mode", "payment_status", "deliveryPartnerStatus", "restaurantStatus", "is_revenue_counted")
      WHERE "is_revenue_counted" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_orders_revenue_lookup"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "is_revenue_counted"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "refunded_amount"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_status"`);
  }
}