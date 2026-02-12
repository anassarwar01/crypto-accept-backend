import { BadRequestException } from '@nestjs/common';
import { Transaction } from '../entities/transaction.entity';
import { TransactionStatus } from '../enums/transaction.enums';
import { MESSAGES } from '@helper/constant/messages';

/**
 * Validates if a transaction is in a valid state for common operations.
 * Centralizes logic from RefMiddleware to be used across HTTP and WebSockets.
 * 
 * @param transaction The transaction entity to validate
 * @param checkStatus Whether to perform the detailed status state check
 * @throws BadRequestException if the transaction is expired or in an invalid state
 */
export function validateTransactionState(transaction: Transaction, checkStatus = true): void {

    // 1. Expiry Check
    if (transaction.expiresAt && transaction.expiresAt <= new Date()) {
        throw new BadRequestException(MESSAGES.TRANSACTION_EXPIRED);
    }

    // 2. Status State Checks
    if (checkStatus) {
        switch (transaction.status) {
            case TransactionStatus.INITIATED:
                // Valid state for most operations
                break;
            case TransactionStatus.PENDING:
                // Valid state for most operations
                break;
            case TransactionStatus.EXPIRED:
                throw new BadRequestException(MESSAGES.TRANSACTION_EXPIRED);
            case TransactionStatus.SUCCEEDED:
                throw new BadRequestException(MESSAGES.TRANSACTION_COMPLETED);
            case TransactionStatus.FAILED:
            case TransactionStatus.CANCELLED:
                throw new BadRequestException(MESSAGES.TRANSACTION_NOT_AVAILABLE);
            default:
                throw new BadRequestException(MESSAGES.TRANSACTION_NOT_AVAILABLE);
        }
    }
}
