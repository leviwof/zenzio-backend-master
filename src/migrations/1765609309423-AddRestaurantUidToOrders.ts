import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRestaurantUidToOrders1765609309423 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "orders" 
            ADD COLUMN IF NOT EXISTS "restaurant_uid" VARCHAR(255) NULL
        `);

    console.log('✅ Added restaurant_uid column to orders table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "orders" 
            DROP COLUMN "restaurant_uid"
        `);

    console.log('✅ Removed restaurant_uid column from orders table');
  }
}
