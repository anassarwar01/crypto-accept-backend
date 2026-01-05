import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Interceptor that injects merchantId from the authenticated request
 * into the request body BEFORE validation runs
 */
@Injectable()
export class InjectMerchantIdInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        // Inject merchantId from the authenticated request (set by AuthMiddleware)
        if (request.body && request.merchantId) {
            request.body.merchantId = request.merchantId;
        }

        return next.handle();
    }
}
