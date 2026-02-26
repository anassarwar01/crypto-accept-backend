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
import { Transaction } from './transaction.entity';
import { TransactionStatus } from '../enums/transaction.enums';

@Entity('transaction_status_history')
export class TransactionStatusHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'transaction_id' })
    @Index('idx_status_history_transaction')
    transactionId: string;

    @Column({
        type: 'enum',
        enum: TransactionStatus,
        name: 'status',
    })
    status: TransactionStatus;

    @Column('jsonb', { name: 'metadata', nullable: true })
    metadata: Record<string, any>;

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

    @ManyToOne(() => Transaction, (transaction) => transaction.statusHistory, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'transaction_id' })
    transaction: Transaction;
}
