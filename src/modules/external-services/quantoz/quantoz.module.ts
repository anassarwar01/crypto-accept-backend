import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { QuantozService } from './quantoz.service';
import { ThirdPartyLogsModule } from '../../third-party-logs/third-party-logs.module';
import { SystemSettingsModule } from '../../system-settings/system-settings.module';

@Module({
  imports: [HttpModule, ThirdPartyLogsModule, ConfigModule, SystemSettingsModule],
  controllers: [],
  providers: [QuantozService],
  exports: [QuantozService],
})
export class QuantozModule { }
