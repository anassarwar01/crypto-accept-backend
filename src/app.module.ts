import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CustomersModule } from './modules/customers/customers.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { CryptocurrencyModule } from './modules/crypto-currencies/crypto-currencies.module';
import { MerchantCustomersModule } from './modules/merchant-customers/merchant-customers.module';
import { ErrorLogsModule } from './modules/error-logs/error-logs.module';
import { RequestLogsModule } from './modules/request-logs/request-logs.module';
import { CronModule } from './cron/cron.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './modules/common/filters/all-exceptions.filter';
import { RequestLoggingInterceptor } from './modules/common/interceptors/request-logging.interceptor';
import { ResponseInterceptor } from './modules/common/interceptors/response.interceptor';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // set to true only in dev
    }),
    UsersModule,
    TransactionsModule,
    CustomersModule,
    MerchantsModule,
    CryptocurrencyModule,
    MerchantCustomersModule,
    ErrorLogsModule,
    RequestLogsModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule { }
