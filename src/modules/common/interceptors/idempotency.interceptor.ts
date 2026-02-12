import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    ConflictException,
    Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { IS_IDEMPOTENT_KEY } from '../decorators/idempotent.decorator';
import { REDIS_CLIENT } from '../../redis/redis.module';
import Redis from 'ioredis';
import * as crypto from 'crypto';
import { SystemSettingsService } from '../../system-settings/system-settings.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
    constructor(
        private reflector: Reflector,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        private readonly systemSettingsService: SystemSettingsService,
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const isIdempotent = this.reflector.getAllAndOverride<boolean>(IS_IDEMPOTENT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!isIdempotent) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        let idempotencyKey = request.headers['x-idempotency-key'];

        const method = request.method;
        const path = request.path;
        const clientIp = request.ip || request.headers['x-forwarded-for'] || 'unknown';
        const bodyHash = crypto.createHash('md5').update(JSON.stringify(request.body || {})).digest('hex');

        // Include critical headers that define the context of the request
        const ref = request.headers['ref'] || '';
        const apiKey = request.headers['x-api-key'] || '';

        // If header is missing, we use a default prefix
        const baseKey = idempotencyKey || 'default';
        const redisKey = `idempotency:${baseKey}:${method}:${path}:${clientIp}:${ref}:${apiKey}:${bodyHash}`;

        // 1. Check if response is already cached
        const cachedResponse = await this.redis.get(redisKey);
        if (cachedResponse) {
            if (cachedResponse === 'PROCESSING') {
                throw new ConflictException('Another request with the same idempotency key is being processed');
            }
            return of(JSON.parse(cachedResponse));
        }

        // 2. Try to acquire a lock (SET NX)
        const lockAcquired = await this.redis.set(redisKey, 'PROCESSING', 'EX', 60, 'NX');
        if (!lockAcquired) {
            // This might happen if another request just slipped in between get and set
            throw new ConflictException('Another request with the same idempotency key is being processed');
        }

        return next.handle().pipe(
            tap(async (response) => {
                // 3. Cache the successful response matching the transaction expiration
                // Fetch expire time (fallback to 15 mins if not set)
                const expireMinutes = await this.systemSettingsService.getNumber('transaction_expire_time') || 15;
                const ttlSeconds = expireMinutes * 60;

                await this.redis.set(redisKey, JSON.stringify(response), 'EX', ttlSeconds);
            }),
        );
    }
}
