import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateGlobalSettings1765609310000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'global_settings',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'enableOnlinePayment',
            type: 'boolean',
            default: true,
          },
          {
            name: 'enableCODPayment',
            type: 'boolean',
            default: true,
          },
        ],
      }),
      true,
    );

    // Insert default row
    await queryRunner.query(
      `INSERT INTO "global_settings" ("enableOnlinePayment", "enableCODPayment") VALUES (true, true)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('global_settings');
  }
}
