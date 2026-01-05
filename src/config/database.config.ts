// src/config/database.config.ts
export default () => ({
  DATABASE_TYPE: process.env.DATABASE_TYPE || 'postgres',
  DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
  DATABASE_PORT: Number(process.env.DATABASE_PORT) || 5432,
  DATABASE_USERNAME: process.env.DATABASE_USERNAME || 'postgres',
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || 'postgres',
  DATABASE_NAME: process.env.DATABASE_NAME || 'crypto_accept',
  DATABASE_SYNCHRONIZE: process.env.DATABASE_SYNCHRONIZE === 'true' || false,
});
