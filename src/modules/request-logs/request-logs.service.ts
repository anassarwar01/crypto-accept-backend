import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestLog } from './entities/request-log.entity';

@Injectable()
export class RequestLogsService {
    private readonly logger = new Logger(RequestLogsService.name);

    constructor(
        @InjectRepository(RequestLog)
        private readonly requestLogRepository: Repository<RequestLog>,
    ) { }

    async logRequest(data: Partial<RequestLog>): Promise<RequestLog | null> {
        try {
            const log = this.requestLogRepository.create(data);
            return await this.requestLogRepository.save(log);
        } catch (error) {
            this.logger.error('Failed to save request log to database', error.stack);
            // We don't want to throw an error here as it would break the main request flow
            return null;
        }
    }
}
