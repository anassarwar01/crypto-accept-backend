import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TransactionRepository } from '@transactions/transaction.repository';

@Injectable()
export class TransactionStatusCron {
    private readonly logger = new Logger(TransactionStatusCron.name);

    constructor(private readonly transactionRepository: TransactionRepository) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        this.logger.debug('Checking for expired transactions...');
        try {
            const affected = await this.transactionRepository.expireOverdueTransactions();
            if (affected > 0) {
                this.logger.log(`Expired ${affected} overdue transactions.`);
            }
        } catch (error) {
            this.logger.error('Error verifying transaction status:', error);
        }
    }
}
