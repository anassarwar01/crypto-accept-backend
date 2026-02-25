import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatus } from './enums/transaction.enums';

@Injectable()
export class TransactionRepository {
    constructor(
        @InjectRepository(Transaction)
        private readonly repository: Repository<Transaction>,
    ) { }

    async findOne(options: any) {
        return this.repository.findOne(options);
    }

    async findByMerchantReference(merchantId: string, merchantReference: string): Promise<Transaction | null> {
        return this.repository.findOne({
            where: {
                merchantId,
                merchantReference,
            },
        });
    }

    async createTransaction(dto: Partial<Transaction>) {
        const entity = this.repository.create(dto);
        return this.repository.save(entity);
    }

    async updateTransaction(entity: Transaction) {
        return this.repository.save(entity);
    }

    async findByReference(systemReference: string): Promise<Transaction | null> {
        return this.repository.findOne({
            where: { systemReference },
            relations: {
                // merchant: true,
                customer: true,
            },
        });
    }

    async findOverdueTransactions(): Promise<Transaction[]> {
        const now = new Date();
        return this.repository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.customer', 'customer')
            .where('transaction.expires_at < :now', { now })
            .andWhere('transaction.status IN (:...statuses)', {
                statuses: [TransactionStatus.INITIATED, TransactionStatus.PENDING],
            })
            .getMany();
    }


    async updateTransactionStatus(systemReference: string, status: TransactionStatus) {
        return this.repository.update({ systemReference }, { status });
    }

    async findById(id: string): Promise<Transaction | null> {
        return this.repository.findOne({ where: { id } as any });
    }

    // other custom methods...
}
