import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeToTransactionsTable1772081100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create the enum type if it doesn't exist
    await queryRunner.query(
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type_enum') THEN
          CREATE TYPE "transaction_type_enum" AS ENUM ('payin', 'payout');
        END IF;
      END $$;`,
    );

    // 2. Add the column to the table
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "type" "transaction_type_enum" NOT NULL DEFAULT 'payin'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remove the column
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "type"`);

    // 2. Drop the enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_type_enum"`);
  }
}
