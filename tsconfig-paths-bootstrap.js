// Bootstrap file to register TypeScript path aliases before TypeORM CLI loads entities
// NOTE: We hardcode the aliases here to avoid JSON parsing issues with comments in tsconfig.json

// Set timezone to UTC for migrations and seeders
process.env.TZ = 'UTC';
process.env.PGTZ = 'UTC';

const tsConfigPaths = require('tsconfig-paths');

tsConfigPaths.register({
  baseUrl: './',
  paths: {
    '@users/*': ['src/modules/users/*'],
    '@merchants/*': ['src/modules/merchants/*'],
    '@customers/*': ['src/modules/customers/*'],
    '@transactions/*': ['src/modules/transactions/*'],
    '@cryptocurrency/*': ['src/modules/cryptocurrency/*'],
    '@database/data-source': ['data-source.ts'],
    '@helper/*': ['src/helper/*'],
    '@crypto-transactions/*': ['src/modules/crypto-transactions/*'],
    '@system-settings/*': ['src/modules/system-settings/*'],
    '@feature-flags/*': ['src/modules/feature-flags/*'],
    '@external-services/*': ['src/modules/external-services/*'],
    '@merchant-settings/*': ['src/modules/merchant-settings/*'],
    '@merchant-customers/*': ['src/modules/merchant-customers/*'],
    '@common/*': ['src/modules/common/*'],
    '@cron/*': ['src/cron/*'],
    '@test/*': ['test/*'],
  },
});

