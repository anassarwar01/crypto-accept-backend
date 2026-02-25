import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TransactionRepository } from '@transactions/transaction.repository';
import { TransactionsService } from '@transactions/transactions.service';
import { TransactionStatus } from '@transactions/enums/transaction.enums';

@Injectable()
export class TransactionStatusCron {
    private readonly logger = new Logger(TransactionStatusCron.name);

    constructor(
        private readonly transactionRepository: TransactionRepository,
        private readonly transactionsService: TransactionsService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        this.logger.debug('Checking for expired transactions...');
        try {
            const overdueTransactions = await this.transactionRepository.findOverdueTransactions();

            if (overdueTransactions.length > 0) {
                this.logger.log(`Found ${overdueTransactions.length} overdue transactions. Processing expiration...`);

                for (const transaction of overdueTransactions) {
                    try {
                        await this.transactionsService.updateStatus(transaction, TransactionStatus.EXPIRED);
                        this.logger.log(`Transaction ${transaction.systemReference} marked as EXPIRED.`);
                    } catch (err) {
                        this.logger.error(`Failed to mark transaction ${transaction.systemReference} as EXPIRED: ${err.message}`);
                    }
                }
            }
        } catch (error) {
            this.logger.error('Error verifying transaction status:', error);
        }
    }
}
