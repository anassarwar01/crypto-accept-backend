import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversionRate } from '../transactions/entities/conversion-rate.entity';
import { ConversionRatesService } from './conversion-rates.service';

@Module({
    imports: [TypeOrmModule.forFeature([ConversionRate])],
    providers: [ConversionRatesService],
    exports: [ConversionRatesService],
})
export class ConversionRatesModule { }
