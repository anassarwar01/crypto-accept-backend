import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExtensionsEnums1700678400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TYPE "user_role_enum" AS ENUM ('admin', 'merchant')`,
    );
    await queryRunner.query(
      `CREATE TYPE "actor_type_enum" AS ENUM ('admin', 'merchant')`,
    );
    await queryRunner.query(
      `CREATE TYPE "transaction_status_enum" AS ENUM (
        'transfer.initiated',
        'transfer.pending',
        'transfer.confirming',
        'transfer.onHold',
        'transfer.succeeded',
        'transfer.failed',
        'transfer.cancelled',
        'transfer.expired'
      )`,
    );
    await queryRunner.query(
      `CREATE TYPE "fiat_currency_enum" AS ENUM ('USD', 'EUR', 'GBP', 'NGN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "crypto_currency_enum" AS ENUM ('BTC', 'ETH', 'LTC', 'ALGO', 'XLM', 'USDC-ETH')`,
    );
    await queryRunner.query(
      `CREATE TYPE "crypto_status_enum" AS ENUM ('sellInitiated', 'sellCompleted', 'blocked', 'deleted', 'toPayout', 'confirming', 'payoutConfirming', 'sellCancelled', 'payoutOnHold', 'buyIncasso', 'sendDelay', 'toCancel')`,
    );
    await queryRunner.query(
      `CREATE TYPE "http_method_enum" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'WS')`,
    );
    await queryRunner.query(
      `CREATE TYPE "third_party_type_enum" AS ENUM ('HTTP', 'CALLBACK', 'WEBHOOK')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE IF EXISTS "third_party_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "http_method_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "crypto_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "crypto_currency_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "fiat_currency_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "actor_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
