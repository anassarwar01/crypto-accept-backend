import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversionRateCron } from './conversion-rate/conversion-rate.cron';
import { FixerModule } from '../modules/external-services/fixer/fixer.module';
import { ConversionRatesModule } from '../modules/conversion-rates/conversion-rates.module';
import { TransactionsModule } from '../modules/transactions/transactions.module';
import { TransactionStatusCron } from './transaction-status/transaction-status.cron';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        FixerModule,
        ConversionRatesModule,
        TransactionsModule,
    ],
    controllers: [],
    providers: [ConversionRateCron, TransactionStatusCron],
})
export class CronModule { }
