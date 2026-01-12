import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Repository } from 'typeorm';
import { MoreThan } from 'typeorm';
import { decodeReference } from '../utils/reference-coder';
import { TransactionStatus } from '../../transactions/enums/transaction.enums';

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
            throw new BadRequestException(
                `Invalid transaction reference.`,
            );
        }

        console.log(ref)

        const transaction = await this.transactionRepository.findOne({
            where: {
                systemReference: ref,
                expiresAt: MoreThan(new Date()),
            },
        });

        if (!transaction) {
            throw new BadRequestException(
                'The transaction is invalid or has expired.',
            );
        }

        switch (transaction.status) {

            case TransactionStatus.EXPIRED:
                throw new BadRequestException('Transaction has expired.');

            case TransactionStatus.PENDING:
            case TransactionStatus.COMPLETED:
                throw new BadRequestException('Transaction is in process.');

            case TransactionStatus.INITIATED:
                // Attach details to request object for logging and downstream use
                (req as any).transaction = transaction;

                break;

            default:
                throw new BadRequestException('Invalid transaction status.');
        }

        next();
    }
}
