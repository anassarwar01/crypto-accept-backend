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

        try {
            return await this.cryptoTransactionRepository.save(record);
        } catch (error) {
            // Handle race condition where record was created between find and save
            if (error.code === '23505') { // Postgres unique_violation
                return (await this.cryptoTransactionRepository.findOneBy({ transactionId: data.transactionId })) as CryptoTransaction;
            }
            throw error;
        }
    }

    async findByTransactionId(transactionId: string): Promise<CryptoTransaction[]> {
        return this.cryptoTransactionRepository.find({ where: { transactionId } });
    }

    async updateStatus(id: string, status: any): Promise<void> {
        await this.cryptoTransactionRepository.update(id, { status });
    }

    async updateTransactionByTransactionCode(transactionCode: string, data: Partial<CryptoTransaction>): Promise<CryptoTransaction | null> {
        await this.cryptoTransactionRepository.update({ transactionCode }, data);
        return await this.cryptoTransactionRepository.findOne({
            where: { transactionCode },
            relations: ['transaction'],
        });
    }

    async findTranctionbyTransactionCode(transactionCode: string): Promise<CryptoTransaction | null> {
        return this.cryptoTransactionRepository.findOne({
            where: { transactionCode },
            relations: ['transaction'],
        });
    }
}
