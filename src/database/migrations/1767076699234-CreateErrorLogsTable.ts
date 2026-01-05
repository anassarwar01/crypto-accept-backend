import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateErrorLogs1700678405000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'error_logs',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'message',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'stacktrace',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'method',
                        type: 'varchar',
                        length: '10',
                        isNullable: true,
                    },
                    {
                        name: 'url',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'requestBody',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'queryParams',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'merchantId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'userId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'statusCode',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('error_logs');
    }
}
