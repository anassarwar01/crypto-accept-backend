import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMerchantCustomers1700678410000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'merchant_customers',
        columns: [
          { name: 'merchant_id', type: 'uuid', isPrimary: true },
          { name: 'customer_id', type: 'uuid', isPrimary: true },
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
            onDelete: 'CASCADE',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('merchant_customers');
  }
}
