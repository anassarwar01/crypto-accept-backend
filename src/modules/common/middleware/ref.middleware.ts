import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Repository } from 'typeorm';
import { MoreThan } from 'typeorm';

@Injectable()
export class RefMiddleware implements NestMiddleware {

    constructor(
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
    ) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const ref = req.headers['ref'];

        // Check ref exist in transaction system reference

        const transaction = await this.transactionRepository.findOne({
            where: {
                systemReference: ref as string,
                expiresAt: MoreThan(new Date()),
            },
        });

        if (!transaction) {
            throw new BadRequestException(
                'The transaction is invalid or has expired.',
            );
        }

        next();
    }
}
