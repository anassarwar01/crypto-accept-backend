import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ThirdPartyLogsModule } from '../../third-party-logs/third-party-logs.module';
import { IpregistryService } from './ipregistry.service';

@Module({
    imports: [HttpModule, ThirdPartyLogsModule],
    providers: [IpregistryService],
    exports: [IpregistryService],
})
export class IpregistryModule { }
