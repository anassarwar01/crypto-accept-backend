import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { AxiosError, Method } from 'axios';
import { ThirdPartyLogsService } from '../../third-party-logs/third-party-logs.service';
import { HttpMethod, ThirdPartyLogType } from '../../third-party-logs/entities/third-party-log.entity';

@Injectable()
export abstract class BaseHttpService {
    protected abstract readonly logger: Logger;

    constructor(
        protected readonly httpService: HttpService,
        protected readonly thirdPartyLogsService: ThirdPartyLogsService,
    ) { }

    protected async request<T = any>(
        method: Method,
        url: string,
        data?: any,
        headers?: any,
        transactionId?: string,
        type: ThirdPartyLogType = ThirdPartyLogType.HTTP,
    ): Promise<T> {
        let axiosResponse: any;
        let responseData: any;
        let status = 200;

        try {
            this.logger.log(`Making ${method} request to: ${url}`);
            axiosResponse = await this.httpService.axiosRef.request<T>({
                method,
                url,
                data,
                headers,
            });

            responseData = axiosResponse.data;
            status = axiosResponse.status;
            return responseData;
        } catch (error: unknown) {
            status = (error as any).response?.status || 500;
            responseData = (error as any).response?.data || { message: (error as Error).message };
            this.handleError(error);
        } finally {
            await this.thirdPartyLogsService.createLog({
                transactionId,
                httpRequest: { url, data, headers },
                httpResponse: responseData,
                httpMethod: method as HttpMethod,
                httpCode: status,
                type,
            }).catch(err => this.logger.error(`Failed to create third party log: ${err.message}`));
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
