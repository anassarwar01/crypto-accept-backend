import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { AcceptTransactionsModule } from './modules/transactions/S2S/accept-transactions.module';
import { CustomersModule } from './modules/customers/customers.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { CryptocurrencyModule } from './modules/crypto-currencies/crypto-currencies.module';
import { MerchantCustomersModule } from './modules/merchant-customers/merchant-customers.module';
import { ErrorLogsModule } from './modules/error-logs/error-logs.module';
import { RequestLogsModule } from './modules/request-logs/request-logs.module';
import { ThirdPartyLogsModule } from './modules/third-party-logs/third-party-logs.module';
import { CronModule } from './cron/cron.module';
import { FeatureFlagModule } from './modules/feature-flags/feature-flag.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { MerchantSettingsModule } from './modules/merchant-settings/merchant-settings.module';
import { HealthModule } from './modules/health/health.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { MerchantThrottlerGuard } from './modules/merchants/guards/merchant-throttler.guard';
import { AllExceptionsFilter } from './modules/common/filters/all-exceptions.filter';
import { RequestLoggingInterceptor } from './modules/common/interceptors/request-logging.interceptor';
import { ResponseInterceptor } from './modules/common/interceptors/response.interceptor';
import { IdempotencyInterceptor } from './modules/common/interceptors/idempotency.interceptor';
import { RouterModule } from '@nestjs/core';
import { API_CONFIG } from './config/api.config';
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
            useUTC: true,
        }),
        UsersModule,
        TransactionsModule,
        AcceptTransactionsModule,
        CustomersModule,
        MerchantsModule,
        CryptocurrencyModule,
        MerchantCustomersModule,
        ErrorLogsModule,
        RequestLogsModule,
        CronModule,
        FeatureFlagModule,
        SystemSettingsModule,
        ThirdPartyLogsModule,
        MerchantSettingsModule,
        HealthModule,
        RouterModule.register([
            {
                path: API_CONFIG.CHECKOUT.PREFIX,
                module: TransactionsModule,
            },
            {
                path: API_CONFIG.ACCEPT.PREFIX,
                module: AcceptTransactionsModule,
            },
        ]),
        ThrottlerModule.forRoot([{
            ttl: 60000, // 60 seconds
            limit: 60, // 60 requests per IP per minute
        }]),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: MerchantThrottlerGuard,
        },
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
        {
            provide: APP_INTERCEPTOR,
            useClass: IdempotencyInterceptor,
        },
    ],
})
export class AppModule { }
