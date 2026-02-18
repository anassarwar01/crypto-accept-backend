import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorLogsService } from '../../error-logs/error-logs.service';
import { RequestLogsService } from '../../request-logs/request-logs.service';
import { HttpMethod } from '../../request-logs/entities/request-log.entity';
import { ApiResponse } from '../../../helper/dto/response.dto';
import { RedirectException } from '../exceptions/redirect.exception';
import { getClientIp } from '../utils/helper';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(
        private readonly httpAdapterHost: HttpAdapterHost,
        private readonly errorLogsService: ErrorLogsService,
        private readonly requestLogsService: RequestLogsService,
    ) { }

    async catch(exception: any, host: ArgumentsHost): Promise<void> {
        // In certain situations `httpAdapter` might not be available in the
        // constructor method, thus we should resolve it here.
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();
        const request = ctx.getRequest();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

        let message = exception?.message || 'Internal server error';
        let errors: any = null;

        if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            message = exceptionResponse['message'] || message;
            if (Array.isArray(message)) {
                errors = message;
                message = 'Validation failed';
            }
        }

        const redirectUrl = request.body?.redirectUrl || request.query?.redirectUrl || request['transaction']?.redirectUrl || null;
        const responseUrl = exception instanceof RedirectException ? exception.url : redirectUrl;

        const responseBody = new ApiResponse(
            httpStatus,
            message,
            errors,
            responseUrl
        );

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const merchantId = uuidRegex.test(request.merchantId) ? request.merchantId : null;
        const userId = uuidRegex.test(request.userId) ? request.userId : null;

        // Prepare log data
        const logData = {
            message: exception?.message || 'Unknown Error',
            stacktrace: exception?.stack,
            method: request.method,
            url: request.url,
            requestBody: request.body,
            queryParams: request.query,
            merchantId: merchantId,
            userId: userId,
            statusCode: httpStatus,
        };

        // Log to console/cli
        if (httpStatus >= 500) {
            this.logger.error(
                `ERR: ${logData.method} ${logData.url} - ${logData.message}`,
                exception?.stack,
            );
        } else {
            this.logger.warn(
                `WARN: ${logData.method} ${logData.url} - ${logData.message}`,
            );
        }

        // Sanitize body
        const sanitizedBody = { ...request.body };
        if (sanitizedBody.password) sanitizedBody.password = '***';
        if (sanitizedBody.apiKey) sanitizedBody.apiKey = '***';
        if (sanitizedBody.api_key) sanitizedBody.api_key = '***';

        // Save to database asynchronously
        try {
            await this.errorLogsService.logError(logData);

            await this.requestLogsService.logRequest({
                userAgent: request.get('user-agent') || '',
                ipAddress: getClientIp(request),
                route: request.url,
                httpMethod: request.method as HttpMethod,
                httpRequest: {
                    body: sanitizedBody,
                    query: request.query,
                    headers: request.headers,
                },
                httpResponse: responseBody,
                httpCode: httpStatus,
                merchantId: merchantId,
                userId: userId,
            } as any);
        } catch (err) {
            this.logger.error('Failed to log error/request to DB', err);
        }

        if (exception instanceof RedirectException) {
            return httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
        }

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}
