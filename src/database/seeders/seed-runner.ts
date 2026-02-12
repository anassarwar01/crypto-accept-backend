// src/database/seeders/seed.ts
import 'reflect-metadata'; // Required by TypeORM
import AppDataSource from '../../../data-source';
import { UserSeederService } from './users/users.service';
import { MerchantsSeederService } from './merchants/merchants.service';
import { CryptocurrenciesSeederService } from './crypto-currencies/crypto-currencies.service';
import { FeatureFlagsSeeder } from './feature-flags/feature-flags.seeder';

async function runSeeders() {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log('Database initialized. Starting seeders...');

        // Run your seeders
        const userSeeder = new UserSeederService();
        await userSeeder.seed();

        const merchantSeeder = new MerchantsSeederService();
        await merchantSeeder.seed();

        const cryptoSeeder = new CryptocurrenciesSeederService();
        await cryptoSeeder.seed();

        const featureFlagSeeder = new FeatureFlagsSeeder();
        await featureFlagSeeder.seed(AppDataSource);

        console.log('All seeders completed!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

runSeeders();
