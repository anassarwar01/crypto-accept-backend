import 'reflect-metadata';
import AppDataSource from '../data-source';

async function main() {
    await AppDataSource.initialize();
    try {
        console.log('Dropping "error_logs" table...');
        await AppDataSource.query('DROP TABLE IF EXISTS "error_logs" CASCADE;');
        console.log('Table dropped successfully.');
    } catch (err) {
        console.error('Error dropping table:', err);
    } finally {
        await AppDataSource.destroy();
    }
}

main().catch(console.error);
