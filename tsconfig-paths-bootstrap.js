// Bootstrap file to register TypeScript path aliases before TypeORM CLI loads entities
// NOTE: We hardcode the aliases here to avoid JSON parsing issues with comments in tsconfig.json
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
  },
});

