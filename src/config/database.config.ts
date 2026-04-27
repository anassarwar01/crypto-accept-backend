// src/config/database.config.ts
export type DatabaseSslConfig =
  | false
  | {
      rejectUnauthorized: boolean;
      ca?: string;
      key?: string;
      cert?: string;
    };

export function buildDatabaseSslConfig(
  env: NodeJS.ProcessEnv = process.env,
): DatabaseSslConfig {
  if (env.DATABASE_SSL_ENABLED !== 'true') return false;
  return {
    rejectUnauthorized: env.DATABASE_REJECT_UNAUTHORIZED === 'true',
    ca: env.DATABASE_CA || undefined,
    key: env.DATABASE_KEY || undefined,
    cert: env.DATABASE_CERT || undefined,
  };
}

export default () => ({
  DATABASE_TYPE: process.env.DATABASE_TYPE || 'postgres',
  DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
  DATABASE_PORT: Number(process.env.DATABASE_PORT) || 5432,
  DATABASE_USERNAME: process.env.DATABASE_USERNAME || 'postgres',
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || 'postgres',
  DATABASE_NAME: process.env.DATABASE_NAME || 'crypto_accept',
  DATABASE_SYNCHRONIZE: process.env.DATABASE_SYNCHRONIZE === 'true' || false,
});
