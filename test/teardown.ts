import AppDataSource from '../data-source';

export default async () => {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Get all table names
        const tables = await AppDataSource.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);

        // Truncate all tables except migrations
        let truncatedCount = 0;
        for (const { tablename } of tables) {
            if (tablename !== 'migrations') {
                await AppDataSource.query(`TRUNCATE TABLE "${tablename}" CASCADE`);
                truncatedCount++;
            }
        }

        console.log(`✓ Test cleanup complete: ${truncatedCount} tables truncated`);

        await AppDataSource.destroy();
    } catch (error: any) {
        // Only log actual errors, not expected scenarios
        if (error.code === 'ECONNREFUSED') {
            console.log('⚠️  Database connection refused - skipping cleanup');
        } else if (error.code !== '3D000') {
            console.error('Error during test cleanup:', error.message);
        }
    }
};
