import {
    Injectable,
    NestMiddleware,
    UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(
        @InjectRepository(Merchant)
        private merchantRepository: Repository<Merchant>,
    ) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const apiKey =
            req.headers['x-api-key'] ||
            req.headers['api-key'] ||
            req.headers['authorization']?.replace('Bearer ', '');


        if (!apiKey) {
            throw new UnauthorizedException(
                'API key is required.',
            );
        }

        const merchant = await this.merchantRepository.findOne({
            where: { apiKey: apiKey as string },
            relations: ['user'],
        });

        if (!merchant) {
            throw new UnauthorizedException('Invalid API key.');
        }

        // Attach merchantId, rateLimit and allowedSources to request object
        (req as any).merchantId = merchant.id;
        (req as any).rateLimit = merchant.rateLimit;
        (req as any).allowedSources = merchant.allowedSources;

        // Also attach to body so it's available for DTO validation
        if (req.body && typeof req.body === 'object') {
            req.body.merchantId = merchant.id;
        }


        next();
    }
}
