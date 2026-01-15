import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
    Index,
    OneToOne,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { CryptoCurrency, CryptoStatus } from '../enums/crypto-transaction.enums';

@Entity('crypto_transactions')
export class CryptoTransaction {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column('uuid', { name: 'transaction_id' })
    @Index('idx_crypto_transactions_transaction')
    transactionId: string;

    @Column({ type: 'varchar', name: 'transaction_code' })
    transactionCode: string;

    @Column({ type: 'varchar', name: 'merchant_code' })
    merchantCode: string;

    @Column({ type: 'varchar', name: 'account_code' })
    accountCode: string;

    @Column({
        type: 'enum',
        enum: CryptoCurrency,
        nullable: true,
        name: 'currency',
    })
    currency: CryptoCurrency;

    @Column('decimal', {
        precision: 14,
        scale: 8,
        nullable: true,
        name: 'amount',
    })
    amount: number;

    @Column({ type: 'varchar', name: 'hash', nullable: true })
    hash: string;

    @Column({ type: 'varchar', name: 'wallet_address', nullable: true })
    walletAddress: string;

    @Column({
        type: 'enum',
        enum: CryptoStatus,
        nullable: true,
        name: 'status',
    })
    status: CryptoStatus;

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
    @OneToOne(() => Transaction, (tx) => tx.cryptoTransaction, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'transaction_id' })
    transaction: Transaction;
}
