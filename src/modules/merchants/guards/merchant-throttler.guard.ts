import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class MerchantThrottlerGuard extends ThrottlerGuard {
    protected async handleRequest(
        requestProps: ThrottlerRequest,
    ): Promise<boolean> {
        const { context, limit, throttler } = requestProps;
        const request = context.switchToHttp().getRequest();

        // Use merchant's rateLimit if available, otherwise fallback to the default 'limit'
        const merchantRateLimit = request.rateLimit;
        const finalLimit =
            merchantRateLimit !== undefined ? merchantRateLimit : limit;

        // Update the limit in requestProps for the super call
        return super.handleRequest({
            ...requestProps,
            limit: finalLimit,
        });
    }

    protected async getTracker(req: Record<string, any>): Promise<string> {
        // If merchantId is present (attached by AuthMiddleware), use it as the tracker key.
        // Otherwise, fall back to IP address.
        return req.merchantId || req.ip;
    }
}
