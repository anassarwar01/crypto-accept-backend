import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestLog } from './entities/request-log.entity';
import { RequestLogsService } from './request-logs.service';

@Module({
    imports: [TypeOrmModule.forFeature([RequestLog])],
    providers: [RequestLogsService],
    exports: [RequestLogsService],
})
export class RequestLogsModule { }
