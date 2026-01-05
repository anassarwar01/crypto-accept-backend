import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { Transaction } from '../../transactions/entities/transaction.entity';
import { MerchantCustomer } from '../../merchant-customers/entities/merchant-customer.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ type: 'varchar', nullable: true, name: 'name' })
  name?: string;

  @Column({ type: 'varchar', unique: true, name: 'email' })
  email: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  updatedAt: Date;

  // Relations
  @OneToMany('Transaction', (transaction: Transaction) => transaction.customer)
  transactions?: Transaction[];

  @OneToMany(
    () => MerchantCustomer,
    (merchantCustomer) => merchantCustomer.customer,
  )
  merchantCustomers?: MerchantCustomer[];
}
