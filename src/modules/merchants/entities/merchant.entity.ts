import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@users/entities/user.entity';
import { Transaction } from '@transactions/entities/transaction.entity';
import { MerchantCustomer } from '@merchant-customers/entities/merchant-customer.entity';
import { MerchantSetting } from '@merchant-settings/entities/merchant-setting.entity';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('uuid', { name: 'user_id', unique: true })
  userId: string;

  @Column({ type: 'varchar', nullable: true, name: 'api_key' })
  apiKey?: string;

  @Column({ type: 'int', default: 60, name: 'rate_limit' })
  rateLimit: number;

  @Column({
    type: 'jsonb',
    default: () => `'[]'::jsonb`,
    name: 'allowed_sources',
  })
  allowedSources: Record<string, any>[];

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

  // Relations
  @ManyToOne(() => User, (user) => user.merchants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany('Transaction', (transaction: Transaction) => transaction.merchant)
  transactions?: Transaction[];

  @OneToMany(
    () => MerchantCustomer,
    (merchantCustomer) => merchantCustomer.merchant,
  )
  merchantCustomers?: MerchantCustomer[];

  @OneToMany(() => MerchantSetting, (setting) => setting.merchant)
  settings?: MerchantSetting[];
}
