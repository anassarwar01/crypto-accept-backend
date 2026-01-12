import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThirdPartyLog } from './entities/third-party-log.entity';
import { ThirdPartyLogsService } from './third-party-logs.service';

@Module({
    imports: [TypeOrmModule.forFeature([ThirdPartyLog])],
    providers: [ThirdPartyLogsService],
    exports: [ThirdPartyLogsService],
})
export class ThirdPartyLogsModule { }
