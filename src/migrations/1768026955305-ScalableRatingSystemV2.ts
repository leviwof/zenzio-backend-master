import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScalableRatingSystemV21768026955305 implements MigrationInterface {
  name = 'ScalableRatingSystemV21768026955305';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Restaurants
    await queryRunner.query(
      `ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "rating_sum" double precision NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "rating_count" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "rating_avg" double precision NOT NULL DEFAULT '0'`,
    );

    // Fleets
    await queryRunner.query(
      `ALTER TABLE "fleets" ADD COLUMN IF NOT EXISTS "rating_sum" double precision NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "fleets" ADD COLUMN IF NOT EXISTS "rating_count" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "fleets" ADD COLUMN IF NOT EXISTS "rating_avg" double precision NOT NULL DEFAULT '0'`,
    );

    // Ratings
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD COLUMN IF NOT EXISTS "order_id" character varying`,
    );

    await queryRunner.query(
      `ALTER TABLE "ratings" DROP CONSTRAINT IF EXISTS "UQ_678aeb7d6df2fdcba5052b32ecb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD CONSTRAINT "UQ_678aeb7d6df2fdcba5052b32ecb" UNIQUE ("order_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "ratings" ADD COLUMN IF NOT EXISTS "restaurant_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratings" ADD COLUMN IF NOT EXISTS "driver_id" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ratings" DROP COLUMN "driver_id"`);
    await queryRunner.query(`ALTER TABLE "ratings" DROP COLUMN "restaurant_id"`);
    await queryRunner.query(
      `ALTER TABLE "ratings" DROP CONSTRAINT "UQ_678aeb7d6df2fdcba5052b32ecb"`,
    );
    await queryRunner.query(`ALTER TABLE "ratings" DROP COLUMN "order_id"`);
    await queryRunner.query(`ALTER TABLE "fleets" DROP COLUMN "rating_avg"`);
    await queryRunner.query(`ALTER TABLE "fleets" DROP COLUMN "rating_count"`);
    await queryRunner.query(`ALTER TABLE "fleets" DROP COLUMN "rating_sum"`);
    await queryRunner.query(`ALTER TABLE "restaurants" DROP COLUMN "rating_avg"`);
    await queryRunner.query(`ALTER TABLE "restaurants" DROP COLUMN "rating_count"`);
    await queryRunner.query(`ALTER TABLE "restaurants" DROP COLUMN "rating_sum"`);
  }
}
