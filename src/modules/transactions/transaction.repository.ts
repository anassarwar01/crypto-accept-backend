import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';

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

    // other custom methods...
}
