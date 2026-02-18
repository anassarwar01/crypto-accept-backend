import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FixerService } from './fixer.service';
import { ThirdPartyLogsModule } from '../../third-party-logs/third-party-logs.module';

@Module({
  imports: [HttpModule, ThirdPartyLogsModule],
  controllers: [],
  providers: [FixerService],
  exports: [FixerService],
})
export class FixerModule { }
