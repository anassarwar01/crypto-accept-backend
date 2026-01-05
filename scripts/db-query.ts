import 'reflect-metadata';
import AppDataSource from '../data-source';

async function main() {
    const query = process.argv[2];
    if (!query) {
        console.error('Please provide a query as an argument');
        process.exit(1);
    }

    await AppDataSource.initialize();
    try {
        const res = await AppDataSource.query(query);
        console.log(JSON.stringify(res, null, 2));
    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await AppDataSource.destroy();
    }
}

main().catch(console.error);
