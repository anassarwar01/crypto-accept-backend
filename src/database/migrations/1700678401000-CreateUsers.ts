import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsers1700678401000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar', isNullable: true },
          { name: 'email', type: 'varchar', isNullable: false, isUnique: true },
          { name: 'password', type: 'varchar', isNullable: false },
          {
            name: 'role',
            type: 'enum',
            enumName: 'user_role_enum',
            enum: ['admin', 'merchant'],
            isNullable: false,
          },
          { name: 'email_verified_at', type: 'timestamp', isNullable: true },
          { name: 'remember_token', type: 'varchar', isNullable: true },
          { name: 'otp_token', type: 'varchar', isNullable: true },
          { name: 'block_timer', type: 'int', isNullable: true },
          { name: 'last_login', type: 'timestamp', isNullable: true },
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
    await queryRunner.dropTable('users');
  }
}
