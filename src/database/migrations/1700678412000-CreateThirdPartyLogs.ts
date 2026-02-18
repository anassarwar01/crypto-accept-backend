import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateThirdPartyLogs1700678412000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'third_party_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'transaction_id', type: 'uuid', isNullable: true },
          { name: 'http_request', type: 'jsonb', isNullable: true },
          { name: 'http_response', type: 'jsonb', isNullable: true },
          {
            name: 'http_method',
            type: 'enum',
            enumName: 'http_method_enum',
            enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'WS'],
            isNullable: true,
          },
          { name: 'http_code', type: 'int', isNullable: true },
          {
            name: 'type',
            type: 'enum',
            enumName: 'third_party_type_enum',
            enum: ['HTTP', 'CALLBACK', 'WEBHOOK'],
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
            onDelete: 'SET NULL',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('third_party_logs');
  }
}
