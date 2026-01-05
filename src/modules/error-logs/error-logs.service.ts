import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorLog } from './entities/error-log.entity';

@Injectable()
export class ErrorLogsService {
    constructor(
        @InjectRepository(ErrorLog)
        private readonly errorLogRepository: Repository<ErrorLog>,
    ) { }

    async logError(data: Partial<ErrorLog>): Promise<ErrorLog | null> {
        try {
            const log = this.errorLogRepository.create(data);
            return await this.errorLogRepository.save(log);
        } catch (err) {
            console.error('Failed to save error log to database:', err);
            // Fallback to console if DB save fails to avoid infinite loops or lost errors
            return null;
        }
    }
}
