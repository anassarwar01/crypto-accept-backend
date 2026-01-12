import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'system_settings' })
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'key', type: 'varchar', nullable: true })
  key: string;

  @Column({ name: 'value', type: 'varchar', nullable: true })
  value: string;

  @Column({ name: 'is_editable', type: 'boolean', default: false, nullable: true })
  is_editable: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
