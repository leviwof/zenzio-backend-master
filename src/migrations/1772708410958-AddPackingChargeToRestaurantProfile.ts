import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPackingChargeToRestaurantProfile1772708410958 implements MigrationInterface {
  name = 'AddPackingChargeToRestaurantProfile1772708410958';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ADD COLUMN IF NOT EXISTS "packing_charge" numeric DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" DROP COLUMN IF EXISTS "packing_charge"`,
    );
  }
}
