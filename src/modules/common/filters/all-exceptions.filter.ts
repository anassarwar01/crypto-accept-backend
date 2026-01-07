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
import { ApiResponse } from '../../../helper/dto/response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    constructor(
        private readonly httpAdapterHost: HttpAdapterHost,
        private readonly errorLogsService: ErrorLogsService,
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

        const responseBody = new ApiResponse(
            httpStatus,
            message,
            errors
        );

        // Prepare log data
        const logData = {
            message: exception?.message || 'Unknown Error',
            stacktrace: exception?.stack,
            method: request.method,
            url: request.url,
            requestBody: request.body,
            //rawBody: request.rawBody, // Capture raw body when JSON parsing fails
            queryParams: request.query,
            merchantId: request.merchantId, // Attached by AuthMiddleware
            userId: request.userId,         // Attached by ApiKeyMiddleware (if still exists)
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

        // Save to database asynchronously (don't block the response)
        try {
            await this.errorLogsService.logError(logData);
        } catch (err) {
            this.logger.error('Failed to log error to DB', err);
        }

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}
