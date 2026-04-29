import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { createHmac } from 'crypto';
import { Transaction } from './entities/transaction.entity';
import { ThirdPartyLogsService } from '../third-party-logs/third-party-logs.service';
import { ThirdPartyLogType, HttpMethod } from '../third-party-logs/entities/third-party-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionStatusHistory } from './entities/transaction-status-history.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TransactionsCallbackService {
    private readonly logger = new Logger(TransactionsCallbackService.name);
    private readonly signatureSecret: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly thirdPartyLogsService: ThirdPartyLogsService,
        @InjectRepository(TransactionStatusHistory)
        private readonly statusHistoryRepository: Repository<TransactionStatusHistory>,
    ) {
        this.signatureSecret = this.configService.get<string>('SOCKET_SIGNATURE_SECRET') || 'default-secret-change-me';
    }

    async sendCallback(transaction: Transaction): Promise<void> {
        if (!transaction.callbackUrl) {
            this.logger.debug(`No callbackUrl for transaction ${transaction.systemReference}. Skipping callback.`);
            return;
        }

        const payload = {
            requestId: transaction.merchantReference,
            systemReference: transaction.systemReference,
            orderId: transaction.shortCode,
            status: transaction.status,
            fiatAmount: Number(transaction.fiatAmount || 0),
            fiatCurrency: transaction.fiatCurrency,
            cryptoAmount: Number(transaction.cryptoTransaction?.amount || transaction.cryptoTransaction?.receivedAmount || 0),
            cryptoCurrency: transaction.cryptoTransaction?.currency ?? null,
            createdAt: transaction.createdAt.toISOString(),
        };

        // Log transaction status
        await this.statusHistoryRepository.save({
            transactionId: transaction.id,
            status: transaction.status,
            metadata: payload
        });

        const signature = this.generateSignature(payload);

        this.logger.log(`Sending callback for transaction ${transaction.systemReference} to ${transaction.callbackUrl}`);

        let response;
        let statusCode = 0;
        try {
            const result = await firstValueFrom(
                this.httpService.post(transaction.callbackUrl, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-callback-signature': signature,
                    },
                    timeout: 10000, // 10 seconds timeout
                })
            );
            response = result.data;
            statusCode = result.status;
        } catch (error) {
            this.logger.error(`Callback failed for transaction ${transaction.systemReference}: ${error.message}`);
            response = error.response ? error.response.data : { error: error.message };
            statusCode = error.response ? error.response.status : 500;
        }

        // Log the callback attempt
        try {
            await this.thirdPartyLogsService.createLog({
                transactionId: transaction.id,
                httpRequest: {
                    url: transaction.callbackUrl,
                    payload,
                    headers: {
                        'x-callback-signature': signature,
                    },
                },
                httpResponse: response,
                httpMethod: HttpMethod.POST,
                httpCode: statusCode,
                type: ThirdPartyLogType.CALLBACK,
            });
        } catch (logError) {
            this.logger.error(`Failed to log callback for transaction ${transaction.systemReference}: ${logError.message}`);
        }
    }

    private generateSignature(payload: any): string {
        const data = JSON.stringify(payload);
        return createHmac('sha256', this.signatureSecret)
            .update(data)
            .digest('hex');
    }
}
