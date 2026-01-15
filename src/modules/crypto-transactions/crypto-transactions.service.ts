import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoTransaction } from './entities/crypto-transaction.entity';

@Injectable()
export class CryptoTransactionsService {
    constructor(
        @InjectRepository(CryptoTransaction)
        private readonly cryptoTransactionRepository: Repository<CryptoTransaction>,
    ) { }

    async upsertRecord(data: Partial<CryptoTransaction>): Promise<CryptoTransaction> {
        let record = await this.cryptoTransactionRepository.findOne({
            where: { transactionId: data.transactionId },
        });

        if (record) {
            Object.assign(record, data);
        } else {
            record = this.cryptoTransactionRepository.create(data);
        }

        return this.cryptoTransactionRepository.save(record);
    }

    async findByTransactionId(transactionId: string): Promise<CryptoTransaction[]> {
        return this.cryptoTransactionRepository.find({ where: { transactionId } });
    }

    async updateStatus(id: string, status: any): Promise<void> {
        await this.cryptoTransactionRepository.update(id, { status });
    }
}
