import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('crypto_currencies')
export class Cryptocurrency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'crypto_currency_name',
    type: 'varchar',
    length: '255',
  })
  cryptoCurrencyName: string;

  @Column({
    name: 'crypto_currency_code',
    type: 'varchar',
    length: '255',
  })
  cryptoCurrencyCode: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;
}
