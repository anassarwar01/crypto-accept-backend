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


    async expireOverdueTransactions(): Promise<number> {
        const now = new Date();
        const result = await this.repository
            .createQueryBuilder()
            .update(Transaction)
            .set({ status: TransactionStatus.EXPIRED })
            .where('expires_at < :now', { now })
            .andWhere('status IN (:...statuses)', {
                statuses: [TransactionStatus.INITIATED, TransactionStatus.PENDING],
            })
            .execute();

        return result.affected || 0;
    }

    // other custom methods...
}
