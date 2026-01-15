import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../common/common.module';
import { MerchantCustomersModule } from '../merchant-customers/merchant-customers.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CryptoTransactionsService } from '../crypto-transactions/crypto-transactions.service';
import { AuthMiddleware } from '../common/middleware/auth.middleware';
import { Transaction } from './entities/transaction.entity';
import { CryptoTransaction } from '../crypto-transactions/entities/crypto-transaction.entity';
import { TransactionRepository } from './transaction.repository';
import { RefMiddleware } from '../common/middleware/ref.middleware';
import { ConversionRatesModule } from '../conversion-rates/conversion-rates.module';
import { CryptocurrencyModule } from '../crypto-currencies/crypto-currencies.module';
import { FeatureFlagModule } from '../feature-flags/feature-flag.module';
import { IpregistryModule } from '../external-services/ipregistry/ipregistry.module';
import { MerchantsModule } from '../merchants/merchants.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { IsCryptocurrencyCodeConstraint } from './decorators/is-cryptocurrency-code.decorator';
import { QuantozModule } from '../external-services/quantoz/quantoz.module';
import { TransactionsGateway } from './gateways/transactions.gateway';
import { IsUniqueRequestIdConstraint } from './decorators/is-unique-request-id.decorator';
import { IsMerchantAllowedUrlConstraint } from './decorators/is-merchant-allowed-url.decorator';
import { TransactionsBroadcastService } from './transactions-broadcast.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, CryptoTransaction]),
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
  ],
  exports: [TransactionsService, CryptoTransactionsService, TransactionsGateway, TransactionRepository, TransactionsBroadcastService],
})
export class TransactionsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Auth for creating transaction
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'transactions', method: RequestMethod.POST });

    // Ref verification for summary
    consumer
      .apply(RefMiddleware)
      .forRoutes(
        { path: 'transactions/summary', method: RequestMethod.POST },
        { path: 'transactions/details', method: RequestMethod.GET },
        { path: 'transactions', method: RequestMethod.GET },
        { path: 'transactions/test/status-update', method: RequestMethod.POST },
      );
  }
}