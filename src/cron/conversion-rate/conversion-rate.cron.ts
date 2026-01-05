import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConversionRatesService } from '../../modules/conversion-rates/conversion-rates.service';

import { FixerService } from '../../modules/external-services/fixer/fixer.service';

import { AllFiatCurrency } from '../../modules/transactions/enums/transaction.enums';

@Injectable()
export class ConversionRateCron {
    private readonly logger = new Logger(ConversionRateCron.name);

    constructor(
        private readonly conversionRatesService: ConversionRatesService,
        private readonly fixerService: FixerService,
    ) { }

    @Cron('0 */8 * * *')
    async handleCron() {
        this.logger.debug('Running conversion rate update cron job');

        try {
            // Fetch latest rates (default base is often EUR for Fixer)
            const response = await this.fixerService.getLatestRates();

            if (!response || !response.success) {
                this.logger.error(`Fixer API error: ${JSON.stringify(response?.error)} `);
                return;
            }

            const rates = response.rates;
            const baseCurrency = response.base; // Usually 'EUR'
            const targets = Object.values(AllFiatCurrency);

            for (const fiat of targets) {
                if (!rates[fiat]) continue;

                const conversionRateValue = parseFloat(rates[fiat].toFixed(8));
                await this.conversionRatesService.updateRate(baseCurrency, fiat, conversionRateValue);
                this.logger.log(`Updated ${baseCurrency}/${fiat} rate to ${conversionRateValue}`);
            }
        } catch (error) {
            this.logger.error(`Cron job failed: ${(error as Error).message}`);
        }
    }

    // Add a manual trigger for testing if needed or just let it run if interval is short
}
