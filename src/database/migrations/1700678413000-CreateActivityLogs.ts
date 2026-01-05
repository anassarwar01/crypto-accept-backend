import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateActivityLogs1700678413000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'activity_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'actor_id', type: 'uuid', isNullable: true },
          {
            name: 'actor_type',
            type: 'enum',
            enumName: 'actor_type_enum',
            enum: ['admin', 'merchant'],
            isNullable: true,
          },
          { name: 'subject', type: 'varchar', isNullable: true },
          { name: 'action', type: 'varchar', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
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
            columnNames: ['actor_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'activity_logs',
      new TableIndex({
        name: 'idx_activity_logs_actor',
        columnNames: ['actor_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('activity_logs', 'idx_activity_logs_actor');
    await queryRunner.dropTable('activity_logs');
  }
}
