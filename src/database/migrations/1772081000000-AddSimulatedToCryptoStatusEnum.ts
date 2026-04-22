import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSimulatedToCryptoStatusEnum1772081000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(
      `ALTER TYPE "crypto_status_enum" ADD VALUE 'simulated'`,
    );

    // Add the second value
    await queryRunner.query(
      `ALTER TYPE "crypto_status_enum" ADD VALUE 'sending'`,
    );

    // Add the thirdsending value
    await queryRunner.query(
      `ALTER TYPE "crypto_status_enum" ADD VALUE 'initiated'`,
    );

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: Postgres does not support removing values from an enum type.
    // To revert, one would typically have to recreate the type and update all dependent tables.
    // For simplicity, we leave this as a no-op or a documented limitation.
  }
}
