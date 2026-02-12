process.env.TZ = 'UTC';
process.env.PGTZ = 'UTC';
// data-source.ts
import path from 'path';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// Use process.cwd() to build paths so this file works when loaded by
// the TypeORM CLI (which may execute this file without a CommonJS
// __dirname available).
const baseDir = process.cwd();

// Support both `DB_*` and `DATABASE_*` env var names. Many projects
// use the `DATABASE_*` prefix in .env while this DataSource originally
// read `DB_*`. Prefer explicit env vars, then fall back to DATABASE_*.
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

export default AppDataSource;
