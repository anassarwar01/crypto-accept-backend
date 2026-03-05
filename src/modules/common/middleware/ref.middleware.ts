import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from '@transactions/entities/transaction.entity';
import { Repository } from 'typeorm';
import { decodeReference } from '../utils/reference-coder';
import { MESSAGES } from '@helper/constant/messages';
import { validateTransactionState } from '@transactions/utils/transaction-validator.util';

@Injectable()
export class RefMiddleware implements NestMiddleware {

    constructor(
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
    ) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const encodedRef = req.headers['ref'];
        const ref = decodeReference(encodedRef);

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!ref || typeof ref !== 'string' || !uuidRegex.test(ref)) {
            throw new BadRequestException(MESSAGES.INVALID_TRANSACTION_REFERENCE);
        }

        const transaction = await this.transactionRepository.findOne({
            where: {
                systemReference: ref,
            },
            relations: {
                // merchant: true,
                customer: true,
            },
        });

        if (!transaction) {
            throw new BadRequestException(MESSAGES.TRANSACTION_INVALID);
        }

        // Attach details to request object for logging and downstream use (including guards)
        (req as any).transaction = transaction;
        (req as any).merchantId = transaction.merchantId;

        validateTransactionState(transaction);

        next();
    }
}
