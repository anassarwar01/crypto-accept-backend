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

  @Column({ type: 'varchar', nullable: true, name: 'first_name' })
  firstName: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'last_name' })
  lastName: string | null;

  @Column({ type: 'varchar', unique: true, name: 'email' })
  email: string;

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
  @OneToMany('Transaction', (transaction: Transaction) => transaction.customer)
  transactions?: Transaction[];

  @OneToMany(
    () => MerchantCustomer,
    (merchantCustomer) => merchantCustomer.customer,
  )
  merchantCustomers?: MerchantCustomer[];
}
