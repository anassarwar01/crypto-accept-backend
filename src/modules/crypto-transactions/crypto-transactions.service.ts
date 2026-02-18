import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoTransaction } from './entities/crypto-transaction.entity';
import { CryptoCurrency } from './enums/crypto-transaction.enums';

@Injectable()
export class CryptoTransactionsService {
    constructor(
        @InjectRepository(CryptoTransaction)
        private readonly cryptoTransactionRepository: Repository<CryptoTransaction>,
    ) { }

    async findActiveByTransactionId(transactionId: string): Promise<CryptoTransaction | null> {
        return this.cryptoTransactionRepository.findOne({
            where: { transactionId },
        });
    }

    async findByTransactionIdAndCurrency(transactionId: string, currency: CryptoCurrency, withDeleted = false): Promise<CryptoTransaction | null> {
        return this.cryptoTransactionRepository.findOne({
            where: { transactionId, currency },
            withDeleted,
        });
    }

    async softDeleteById(id: string): Promise<void> {
        if (!id) return;
        await this.cryptoTransactionRepository.softDelete(id);
    }

    async softDeleteByTransactionId(transactionId: string): Promise<void> {
        await this.cryptoTransactionRepository.softDelete({ transactionId });
    }

    async restoreByTransactionIdAndCurrency(transactionId: string, currency: CryptoCurrency): Promise<void> {
        const record = await this.cryptoTransactionRepository.findOne({
            where: { transactionId, currency },
            withDeleted: true,
        });

        if (record && record.deletedAt) {
            await this.cryptoTransactionRepository.restore(record.id);
        }
    }

    async upsertRecord(data: Partial<CryptoTransaction>): Promise<CryptoTransaction> {
        let record = await this.cryptoTransactionRepository.findOne({
            where: { transactionId: data.transactionId, currency: data.currency },
            withDeleted: true,
        });

        if (record) {
            Object.assign(record, data);
            if (record.deletedAt) {
                await this.cryptoTransactionRepository.restore(record.id);
                record.deletedAt = null as any;
            } else {
                record.deletedAt = null as any;
            }
        } else {
            record = this.cryptoTransactionRepository.create({
                ...data,
                deletedAt: null as any
            });
        }

        try {
            return await this.cryptoTransactionRepository.save(record);
        } catch (error) {
            // Handle race condition
            if (error.code === '23505') {
                return (await this.cryptoTransactionRepository.findOne({
                    where: { transactionId: data.transactionId, currency: data.currency },
                })) as CryptoTransaction;
            }
            throw error;
        }
    }

    async findByTransactionId(transactionId: string): Promise<CryptoTransaction[]> {
        return this.cryptoTransactionRepository.find({
            where: { transactionId },
            withDeleted: true,
        });
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
