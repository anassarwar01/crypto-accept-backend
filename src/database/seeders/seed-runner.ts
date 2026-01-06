// src/database/seeders/seed.ts
import 'reflect-metadata'; // Required by TypeORM
import AppDataSource from '../../../data-source';
import { UserSeederService } from './user/user.service';
import { MerchantSeederService } from './merchant/merchant.service';
import { CryptocurrencySeederService } from './cryptocurrency/crypto-currency.service';

async function runSeeders() {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log('Database initialized. Starting seeders...');

        // Run your seeders
        // const userSeeder = new UserSeederService();
        // await userSeeder.seed();

        // const merchantSeeder = new MerchantSeederService();
        // await merchantSeeder.seed();

        const cryptoSeeder = new CryptocurrencySeederService();
        await cryptoSeeder.seed();

        console.log('All seeders completed!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

runSeeders();
