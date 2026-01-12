import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThirdPartyLog, ThirdPartyLogType, HttpMethod } from './entities/third-party-log.entity';

@Injectable()
export class ThirdPartyLogsService {
    constructor(
        @InjectRepository(ThirdPartyLog)
        private readonly repository: Repository<ThirdPartyLog>,
    ) { }

    async createLog(data: {
        transactionId?: string;
        httpRequest: any;
        httpResponse: any;
        httpMethod: HttpMethod;
        httpCode: number;
        type: ThirdPartyLogType;
    }): Promise<ThirdPartyLog> {
        const log = this.repository.create({
            transactionId: data.transactionId,
            httpRequest: data.httpRequest,
            httpResponse: data.httpResponse,
            httpMethod: data.httpMethod,
            httpCode: data.httpCode,
            type: data.type,
        });

        return await this.repository.save(log);
    }
}
