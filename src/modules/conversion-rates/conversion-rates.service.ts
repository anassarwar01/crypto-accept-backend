import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversionRate } from '../transactions/entities/conversion-rate.entity';

@Injectable()
export class ConversionRatesService {
    private readonly logger = new Logger(ConversionRatesService.name);

    constructor(
        @InjectRepository(ConversionRate)
        private readonly conversionRateRepo: Repository<ConversionRate>,
    ) { }

    async getRate(base: string, target: string): Promise<number | null> {
        if (base === target) return 1;

        const rate = await this.conversionRateRepo.findOne({
            where: { baseCurrency: base, fiatCurrency: target },
        });

        if (!rate) {
            this.logger.warn(`No conversion rate found for ${base}/${target}`);
            return null;
        }

        return Number(rate.fiatConversionRate);
    }

    async updateRate(base: string, target: string, value: number): Promise<void> {
        let rate = await this.conversionRateRepo.findOne({
            where: { baseCurrency: base, fiatCurrency: target },
        });

        if (!rate) {
            rate = this.conversionRateRepo.create({
                baseCurrency: base,
                fiatCurrency: target,
            });
        }

        rate.fiatConversionRate = value;
        await this.conversionRateRepo.save(rate);
    }
}
