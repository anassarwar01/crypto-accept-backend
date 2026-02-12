import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { QuantozService } from './quantoz.service';
import { ThirdPartyLogsModule } from '../../third-party-logs/third-party-logs.module';

@Module({
  imports: [HttpModule, ThirdPartyLogsModule, ConfigModule],
  controllers: [],
  providers: [QuantozService],
  exports: [QuantozService],
})
export class QuantozModule { }
