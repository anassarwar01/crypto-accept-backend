import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { AxiosError, Method } from 'axios';

@Injectable()
export abstract class BaseHttpService {
    protected abstract readonly logger: Logger;

    constructor(protected readonly httpService: HttpService) { }

    protected async request<T = any>(
        method: Method,
        url: string,
        data?: any,
        headers?: any,
    ): Promise<T> {
        try {
            this.logger.log(`Making ${method} request to: ${url}`);
            const response = await this.httpService.axiosRef.request<T>({
                method,
                url,
                data,
                headers,
            });

            return response.data;
        } catch (error: unknown) {
            this.handleError(error);
        }
    }

    protected handleError(error: unknown): never {
        if (this.isAxiosError(error)) {
            const errResponse = error.response;
            const message = errResponse?.data ?? 'External API error';
            const status = errResponse?.status ?? 500;

            this.logger.error(
                `API Error: ${JSON.stringify(message)} | Status: ${status}`,
            );

            throw new HttpException(message, status);
        }

        this.logger.error(`Unknown error: ${(error as Error).message}`);
        throw new HttpException('Internal server error during external call', 500);
    }

    private isAxiosError(error: any): error is AxiosError {
        return error.isAxiosError === true;
    }
}
