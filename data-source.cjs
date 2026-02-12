// data-source.cjs - CommonJS version for TypeORM CLI
const path = require('path');
const { DataSource } = require('typeorm');
require('dotenv').config();

// Register TypeScript path aliases
require('tsconfig-paths').register({
  baseUrl: './',
  paths: {
    '@users/*': ['src/modules/users/*'],
    '@merchants/*': ['src/modules/merchants/*'],
    '@customers/*': ['src/modules/customers/*'],
    '@transactions/*': ['src/modules/transactions/*'],
    '@cryptocurrency/*': ['src/modules/cryptocurrency/*'],
    '@crypto-transactions/*': ['src/modules/crypto-transactions/*'],
    '@system-settings/*': ['src/modules/system-settings/*'],
    '@feature-flags/*': ['src/modules/feature-flags/*'],
    '@external-services/*': ['src/modules/external-services/*'],
    '@merchant-customers/*': ['src/modules/merchant-customers/*'],
    '@common/*': ['src/modules/common/*'],
    '@cron/*': ['src/cron/*'],
    '@test/*': ['test/*'],
  },
});

const baseDir = process.cwd();

const env = process.env;

const dbHost =
  env.DB_HOST ?? env.DATABASE_HOST ?? env.DATABASE_HOSTNAME ?? 'localhost';

const dbPort = parseInt(env.DB_PORT ?? env.DATABASE_PORT ?? '5432', 10);

const dbUser =
  env.DB_USER ?? env.DATABASE_USERNAME ?? env.DATABASE_USER ?? env.USER;
const dbPass = env.DB_PASS ?? env.DATABASE_PASSWORD ?? env.DATABASE_PASS;
const dbName =
  env.DB_NAME ?? env.DATABASE_NAME ?? env.DB_DATABASE ?? env.DATABASE_DB;

const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbHost,
  port: dbPort,
  username: dbUser,
  password: dbPass,
  database: dbName,
  entities: [path.join(baseDir, 'src/**/*.entity{.ts,.js}')],
  migrations: [path.join(baseDir, 'src/database/migrations/*{.ts,.js}')],
  useUTC: true,
});

module.exports = AppDataSource;
