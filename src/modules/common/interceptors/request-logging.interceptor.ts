import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { RequestLogsService } from '../../request-logs/request-logs.service';
import { getClientIp } from '../utils/helper';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(RequestLoggingInterceptor.name);

    constructor(private readonly requestLogsService: RequestLogsService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, query } = request;
        const ip = getClientIp(request);
        const userAgent = request.get('user-agent') || '';

        // Sanitize body (remove sensitive data like passwords)
        const sanitizedBody = { ...body };
        if (sanitizedBody.password) sanitizedBody.password = '***';
        if (sanitizedBody.apiKey) sanitizedBody.apiKey = '***';
        if (sanitizedBody.api_key) sanitizedBody.api_key = '***';

        return next.handle().pipe(
            concatMap(async (data) => {
                const response = context.switchToHttp().getResponse();
                const statusCode = response.statusCode;

                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                const merchantId = uuidRegex.test(request.merchantId) ? request.merchantId : null;
                const userId = uuidRegex.test(request.userId) ? request.userId : null;

                try {
                    await this.requestLogsService.logRequest({
                        userAgent,
                        ipAddress: ip,
                        route: url,
                        httpMethod: method as HttpMethod,
                        httpRequest: {
                            body: sanitizedBody,
                            query,
                            headers: request.headers,
                        },
                        httpResponse: data, // Success data
                        httpCode: statusCode,
                        merchantId,
                        userId,
                    } as any);
                } catch (err) {
                    this.logger.error('Error logging success request in interceptor', err);
                }
                return data;
            }),
        );
    }
}
