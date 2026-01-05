import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversionRateCron } from './conversion-rate/conversion-rate.cron';
import { FixerModule } from '../modules/external-services/fixer/fixer.module';
import { ConversionRatesModule } from '../modules/conversion-rates/conversion-rates.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        FixerModule,
        ConversionRatesModule,
    ],
    controllers: [],
    providers: [ConversionRateCron],
})
export class CronModule { }
