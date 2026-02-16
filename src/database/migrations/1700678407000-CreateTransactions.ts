import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTransactions1700678407000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'merchant_id', type: 'uuid', isNullable: false },
          { name: 'customer_id', type: 'uuid', isNullable: true },
          {
            name: 'system_reference',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          { name: 'merchant_reference', type: 'varchar', isNullable: false },
          { name: 'short_code', type: 'varchar', isNullable: false },
          {
            name: 'fiat_base_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'fiat_converted_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'fiat_currency',
            type: 'enum',
            enumName: 'fiat_currency_enum',
            enum: ['USD', 'EUR', 'GBP', 'NGN'],
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'transaction_status_enum',
            enum: [
              'transfer.initiated',
              'transfer.pending',
              'transfer.confirming',
              'transfer.succeeded',
              'transfer.failed',
              'transfer.cancelled',
              'transfer.expired',
            ],
            default: `'transfer.initiated'`,
            isNullable: false,
          },
          { name: 'expires_at', type: 'timestamp', isNullable: true },
          { name: 'order_items', type: 'jsonb', isNullable: true },
          {
            name: 'callback_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'redirect_url',
            type: 'varchar',
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
            columnNames: ['merchant_id'],
            referencedTableName: 'merchants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['customer_id'],
            referencedTableName: 'customers',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'idx_transactions_merchant',
        columnNames: ['merchant_id'],
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'idx_transactions_customer',
        columnNames: ['customer_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('transactions', 'idx_transactions_customer');
    await queryRunner.dropIndex('transactions', 'idx_transactions_merchant');
    await queryRunner.dropTable('transactions');
  }
}
