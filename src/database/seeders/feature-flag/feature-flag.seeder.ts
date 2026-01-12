import { DataSource } from 'typeorm';
import { FeatureFlag } from '../../../modules/feature-flags/entities/feature-flag.entity';

export class FeatureFlagSeeder {
    async seed(dataSource: DataSource): Promise<void> {
        const repository = dataSource.getRepository(FeatureFlag);

        const existingFlag = await repository.findOne({ where: { key: 'country_restriction' } });

        if (!existingFlag) {
            const flag = repository.create({
                key: 'country_restriction',
                active: true,
                rules: {
                    allowed_countries: ['US', 'GB', 'CA'],
                },
                defaultValues: {},
            });
            await repository.save(flag);
            console.log('Feature flag "country_restriction" seeded.');
        } else {
            console.log('Feature flag "country_restriction" already exists.');
        }
    }
}
