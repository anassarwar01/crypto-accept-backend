import 'reflect-metadata';
import AppDataSource from '../data-source';

async function main() {
  await AppDataSource.initialize();
  try {
    type DbInfo = { db: string; user: string };

    // Type the query result to avoid `any` assignment warnings.
    // Use a variable type annotation instead of a type assertion to satisfy
    // the `no-unnecessary-type-assertion` ESLint rule.
    const res: DbInfo[] = await AppDataSource.query(
      `SELECT current_database() AS db, current_user AS user`,
    );

    if (res.length > 0) {
      console.log('Connection details:', res[0]);
    } else {
      console.log('Connection details: (no rows returned)');
    }
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
