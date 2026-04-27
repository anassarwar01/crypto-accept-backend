import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { QuantozService } from './quantoz.service';
import { ThirdPartyLogsModule } from '../../third-party-logs/third-party-logs.module';
import { SystemSettingsModule } from '../../system-settings/system-settings.module';
import { QuantozEncryption } from './helper/quantoz-encryption.helper';
import { QuantozWebhookController } from './webhooks/quantoz-webhook.controller';
import { TransactionsModule } from '../../transactions/transactions.module';

@Module({
  imports: [HttpModule, ThirdPartyLogsModule, ConfigModule, SystemSettingsModule, forwardRef(() => TransactionsModule)],
  controllers: [QuantozWebhookController],
  providers: [QuantozService, QuantozEncryption],
  exports: [QuantozService, QuantozEncryption],
})
export class QuantozModule { }
