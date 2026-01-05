import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Merchant } from '@merchants/entities/merchant.entity';
import { Customer } from '@customers/entities/customer.entity';
import { FiatCurrency, TransactionStatus } from '../enums/transaction.enums';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column('uuid', { name: 'merchant_id' })
  @Index('idx_transactions_merchant')
  merchantId: string;

  @Column('uuid', { name: 'customer_id', nullable: true })
  @Index('idx_transactions_customer')
  customerId?: string;

  @Column('uuid', { name: 'system_reference', unique: true })
  systemReference: string;

  @Column({ type: 'varchar', name: 'merchant_reference' })
  merchantReference: string;

  @Column({ type: 'varchar', name: 'short_code' })
  shortCode: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'fiat_base_amount',
  })
  fiatBaseAmount?: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'fiat_converted_amount',
  })
  fiatConvertedAmount?: number;

  @Column({
    type: 'enum',
    enum: FiatCurrency,
    nullable: true,
    name: 'fiat_currency',
  })
  fiatCurrency?: FiatCurrency;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.INITIATED,
    name: 'status',
  })
  status: TransactionStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'order_items' })
  orderItems?: Record<string, any>[];

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
  @ManyToOne(() => Merchant, (merchant) => merchant.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => Customer, (customer) => customer.transactions, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;
}
