import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { CommonModule } from '../common/common.module';
import { User } from '../users/entities/user.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { MerchantCustomersModule } from '../merchant-customers/merchant-customers.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { AuthMiddleware } from '../common/middleware/auth.middleware';
import { Transaction } from './entities/transaction.entity';
import { TransactionRepository } from './transaction.repository';
import { RefMiddleware } from '../common/middleware/ref.middleware';
import { ConversionRatesModule } from '../conversion-rates/conversion-rates.module';
import { CryptocurrencyModule } from '../cryptocurrency/cryptocurrency.module';
import { IsCryptocurrencyCodeConstraint } from './decorators/is-cryptocurrency-code.decorator';
import { TransactionsGateway } from './gateways/transactions.gateway';
import { IsUniqueRequestIdConstraint } from './decorators/is-unique-request-id.decorator';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    CustomersModule,
    UsersModule,
    OrdersModule,
    CommonModule,
    MerchantCustomersModule,
    CryptocurrencyModule,
    ConversionRatesModule,
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionRepository,
    IsCryptocurrencyCodeConstraint,
    IsUniqueRequestIdConstraint,
    TransactionsGateway,
  ],
  exports: [TransactionsService, TransactionsGateway],
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
      );
  }
}