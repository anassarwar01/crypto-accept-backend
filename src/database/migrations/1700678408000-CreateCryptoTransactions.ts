import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCryptoTransactions1700678408000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'crypto_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'transaction_id', type: 'uuid', isNullable: false },
          { name: 'transaction_code', type: 'varchar', isNullable: false },
          { name: 'merchant_code', type: 'varchar', isNullable: false },
          { name: 'account_code', type: 'varchar', isNullable: false },
          {
            name: 'currency',
            type: 'enum',
            enumName: 'crypto_currency_enum',
            enum: ['BTC', 'ETH', 'LTC', 'ALGO', 'XLM'],
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 14,
            scale: 8,
            isNullable: true,
          },
          { name: 'hash', type: 'varchar', isNullable: true },
          { name: 'wallet_address', type: 'varchar', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enumName: 'crypto_status_enum',
            enum: ['initiated', 'pending', 'confirmed', 'failed', 'cancelled'],
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['transaction_id'],
            referencedTableName: 'transactions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'crypto_transactions',
      new TableIndex({
        name: 'idx_crypto_transactions_transaction',
        columnNames: ['transaction_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'crypto_transactions',
      'idx_crypto_transactions_transaction',
    );
    await queryRunner.dropTable('crypto_transactions');
  }
}
