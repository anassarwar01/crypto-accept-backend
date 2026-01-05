import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateRequestLogs1700678411000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'request_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'user_agent', type: 'text', isNullable: true },
          { name: 'ip_address', type: 'varchar', isNullable: true },
          { name: 'route', type: 'varchar', isNullable: true },
          { name: 'http_request', type: 'jsonb', isNullable: true },
          { name: 'http_response', type: 'jsonb', isNullable: true },
          {
            name: 'http_method',
            type: 'enum',
            enumName: 'http_method_enum',
            enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
            isNullable: true,
          },
          { name: 'http_code', type: 'int', isNullable: true },
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
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('request_logs');
  }
}
