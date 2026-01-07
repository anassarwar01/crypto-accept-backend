import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
    HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';
import { RequestLogsService } from '../../request-logs/request-logs.service';
import { HttpMethod } from '../../request-logs/entities/request-log.entity';
import { ApiResponse } from '../../../helper/dto/response.dto';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(RequestLoggingInterceptor.name);

    constructor(private readonly requestLogsService: RequestLogsService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, query, ip } = request;
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
                        httpResponse: data,
                        httpCode: statusCode,
                    });
                } catch (err) {
                    this.logger.error('Error logging request in interceptor', err);
                }
                return data;
            }),
            catchError(async (error) => {
                // Errors are handled by the Exception Filter, but we log the request here for full history.
                const statusCode = error instanceof HttpException ? error.getStatus() : 500;
                const exceptionResponse = error instanceof HttpException ? error.getResponse() : null;

                let message = error?.message || 'Internal server error';
                let data: any = null;

                if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                    message = exceptionResponse['message'] || message;
                    if (Array.isArray(message)) {
                        data = message;
                        message = 'Validation failed';
                    }
                }

                const responseBody = new ApiResponse(statusCode, message, data);

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
                        httpResponse: responseBody,
                        httpCode: statusCode,
                    });
                } catch (err) {
                    this.logger.error('Error logging failed request in interceptor', err);
                }
                throw error;
            }),
        );
    }
}
