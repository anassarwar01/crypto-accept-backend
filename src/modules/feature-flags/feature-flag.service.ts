import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag } from './entities/feature-flag.entity';

@Injectable()
export class FeatureFlagService {
    constructor(
        @InjectRepository(FeatureFlag)
        private featureFlagRepository: Repository<FeatureFlag>,
    ) { }

    async getFlag(key: string): Promise<FeatureFlag | null> {
        return this.featureFlagRepository.findOne({ where: { key } });
    }

    async isCountryAllowed(countryCode: string): Promise<boolean> {
        const flag = await this.getFlag('country_restriction');

        // If flag doesn't exist or is not active, allow by default
        if (!flag || !flag.active) {
            return true;
        }

        // Rules logic: expected rules format { "allowed_countries": ["US", "GB", ...] }
        const allowedCountries = flag.rules?.allowed_countries;

        if (!allowedCountries || !Array.isArray(allowedCountries)) {
            return true; // If no allowed list specified but flag is active, assume all allowed or misconfigured
        }

        return allowedCountries.includes(countryCode.toUpperCase());
    }
}
