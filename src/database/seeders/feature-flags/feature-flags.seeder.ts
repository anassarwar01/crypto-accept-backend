import { DataSource } from 'typeorm';
import { FeatureFlag } from '../../../modules/feature-flags/entities/feature-flag.entity';

export class FeatureFlagsSeeder {
    async seed(dataSource: DataSource): Promise<void> {
        const repository = dataSource.getRepository(FeatureFlag);

        // Seed country_restriction flag
        const existingCountryFlag = await repository.findOne({ where: { key: 'country_restriction' } });

        if (!existingCountryFlag) {
            const countryFlag = repository.create({
                key: 'country_restriction',
                active: true,
                rules: {
                    allowed_countries: ['US', 'GB', 'CA'],
                },
                defaultValues: {},
            });
            await repository.save(countryFlag);
            console.log('Feature flag "country_restriction" seeded.');
        } else {
            console.log('Feature flag "country_restriction" already exists.');
        }

        // Seed quantoz_simulation flag
        const existingQuantozFlag = await repository.findOne({ where: { key: 'quantoz_simulation' } });

        if (!existingQuantozFlag) {
            const quantozFlag = repository.create({
                key: 'quantoz_simulation',
                active: true,
                rules: {},
                defaultValues: {},
            });
            await repository.save(quantozFlag);
            console.log('Feature flag "quantoz_simulation" seeded.');
        } else {
            console.log('Feature flag "quantoz_simulation" already exists.');
        }
    }
}
