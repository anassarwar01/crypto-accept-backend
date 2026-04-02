import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { API_CONFIG } from '../../config/api.config';
import { CustomersModule } from '../customers/customers.module';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../common/common.module';
import { MerchantCustomersModule } from '../merchant-customers/merchant-customers.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CryptoTransactionsService } from '../crypto-transactions/crypto-transactions.service';
import { AuthMiddleware } from '../common/middleware/auth.middleware';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatusHistory } from './entities/transaction-status-history.entity';
import { CryptoTransaction } from '../crypto-transactions/entities/crypto-transaction.entity';
import { TransactionRepository } from './transaction.repository';
import { RefMiddleware } from '../common/middleware/ref.middleware';
import { ConversionRatesModule } from '../conversion-rates/conversion-rates.module';
import { CryptocurrencyModule } from '../crypto-currencies/crypto-currencies.module';
import { FeatureFlagModule } from '../feature-flags/feature-flag.module';
import { IpregistryModule } from '../external-services/ipregistry/ipregistry.module';
import { MerchantsModule } from '../merchants/merchants.module';
import { MerchantSettingsModule } from '../merchant-settings/merchant-settings.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { IsCryptocurrencyCodeConstraint } from './decorators/is-cryptocurrency-code.decorator';
import { QuantozModule } from '../external-services/quantoz/quantoz.module';
import { TransactionsGateway } from './gateways/transactions.gateway';
import { IsUniqueRequestIdConstraint } from './decorators/is-unique-request-id.decorator';
import { IsMerchantAllowedUrlConstraint } from './decorators/is-merchant-allowed-url.decorator';
import { TransactionsBroadcastService } from './transactions-broadcast.service';

import { HttpModule } from '@nestjs/axios';
import { ThirdPartyLogsModule } from '../third-party-logs/third-party-logs.module';
import { TransactionsCallbackService } from './transactions-callback.service';
import { RequestLogsModule } from '../request-logs/request-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, CryptoTransaction, TransactionStatusHistory]),
    CustomersModule,
    UsersModule,
    CommonModule,
    MerchantCustomersModule,
    CryptocurrencyModule,
    ConversionRatesModule,
    FeatureFlagModule,
    IpregistryModule,
    MerchantsModule,
    SystemSettingsModule,
    QuantozModule,
    HttpModule,
    ThirdPartyLogsModule,
    RequestLogsModule,
    MerchantSettingsModule,
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    CryptoTransactionsService,
    TransactionRepository,
    IsCryptocurrencyCodeConstraint,
    IsUniqueRequestIdConstraint,
    IsMerchantAllowedUrlConstraint,
    TransactionsGateway,
    TransactionsBroadcastService,
    TransactionsCallbackService,
  ],
  exports: [TransactionsService, CryptoTransactionsService, TransactionsGateway, TransactionRepository, TransactionsBroadcastService, TransactionsCallbackService],
})
export class TransactionsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Auth for creating transaction (POST /transactions)
    consumer
      .apply(AuthMiddleware)
      .exclude(
        `${API_CONFIG.CHECKOUT.PREFIX}/transactions/details`,
        `${API_CONFIG.CHECKOUT.PREFIX}/transactions/summary`,
      )
      .forRoutes(TransactionsController);

    // Ref verification for specific routes (summary, details)
    consumer
      .apply(RefMiddleware)
      .forRoutes(
        `${API_CONFIG.CHECKOUT.PREFIX}/transactions/details`,
        `${API_CONFIG.CHECKOUT.PREFIX}/transactions/summary`,
      );
  }
}