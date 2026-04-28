import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { API_CONFIG } from '../api.config';

export function setupCheckoutSwagger(app: INestApplication): void {
  const checkoutConfig = new DocumentBuilder()
    .setTitle('Checkout API Documentation')
    // .setDescription('Public Checkout APIs')
    .setVersion('1.0')
    // No hardcoded server — resolved dynamically per request
    .addServer(process.env.SWAGGER_BASE_PATH || '/')
    .build();

  const checkoutDocument = SwaggerModule.createDocument(app, checkoutConfig);

  /**
   * Filter Checkout endpoints to remove \`/accept/\` routes
   * and their associated unused schemas
   */
  const filteredCheckoutPaths = {};
  const usedSchemas = new Set<string>();

  const extractRefs = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    if (
      obj.$ref &&
      typeof obj.$ref === 'string' &&
      obj.$ref.startsWith('#/components/schemas/')
    ) {
      usedSchemas.add(obj.$ref.replace('#/components/schemas/', ''));
    }
    Object.values(obj).forEach(extractRefs);
  };

  /**
   * 2. System Webhooks
   * Manually added as they appear after APIs in the UI
   */
  const webhooks = {
    'Transaction Status Update': {
      description: 'Webhook sent to the merchant when a transaction status changes.',
      post: {
        description: 'The payload contains the latest transaction details and status.',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/MerchantWebhookPayloadDto',
              },
              examples: {
                'Status: Pending': {
                  summary: 'Transaction is pending payment',
                  value: {
                    requestId: 'req_123456',
                    systemReference: 'SYS-BTC-12345',
                    orderId: '87G2A1',
                    status: 'transfer.pending',
                    fiatAmount: 100.50,
                    fiatCurrency: 'EUR',
                    cryptoAmount: 0.0025,
                    cryptoCurrency: 'BTC',
                    createdAt: '2026-03-03T17:00:00.000Z',
                  },
                },
                'Status: On Hold': {
                  summary: 'Transaction is currently on hold',
                  value: {
                    requestId: 'req_123456',
                    systemReference: 'SYS-BTC-12345',
                    orderId: '87G2A1',
                    status: 'transfer.onHold',
                    fiatAmount: 100.50,
                    fiatCurrency: 'EUR',
                    cryptoAmount: 0.0025,
                    cryptoCurrency: 'BTC',
                    createdAt: '2026-03-03T17:00:00.000Z',
                  },
                },
                'Status: Confirming': {
                  summary: 'Transaction is being confirmed on the blockchain',
                  value: {
                    requestId: 'req_123456',
                    systemReference: 'SYS-BTC-12345',
                    orderId: '87G2A1',
                    status: 'transfer.confirming',
                    fiatAmount: 100.50,
                    fiatCurrency: 'EUR',
                    cryptoAmount: 0.0025,
                    cryptoCurrency: 'BTC',
                    createdAt: '2026-03-03T17:00:00.000Z',
                  },
                },
                'Status: Succeeded': {
                  summary: 'Transaction has been successfully completed',
                  value: {
                    requestId: 'req_123456',
                    systemReference: 'SYS-BTC-12345',
                    orderId: '87G2A1',
                    status: 'transfer.succeeded',
                    fiatAmount: 100.50,
                    fiatCurrency: 'EUR',
                    cryptoAmount: 0.0025,
                    cryptoCurrency: 'BTC',
                    createdAt: '2026-03-03T17:00:00.000Z',
                  },
                },
                'Status: Failed': {
                  summary: 'Transaction has failed',
                  value: {
                    requestId: 'req_123456',
                    systemReference: 'SYS-BTC-12345',
                    orderId: '87G2A1',
                    status: 'transfer.failed',
                    fiatAmount: 100.50,
                    fiatCurrency: 'EUR',
                    cryptoAmount: 0.0025,
                    cryptoCurrency: 'BTC',
                    createdAt: '2026-03-03T17:00:00.000Z',
                  },
                },
                'Status: Cancelled': {
                  summary: 'Transaction was cancelled',
                  value: {
                    requestId: 'req_123456',
                    systemReference: 'SYS-BTC-12345',
                    orderId: '87G2A1',
                    status: 'transfer.cancelled',
                    fiatAmount: 100.50,
                    fiatCurrency: 'EUR',
                    cryptoAmount: 0.0025,
                    cryptoCurrency: 'BTC',
                    createdAt: '2026-03-03T17:00:00.000Z',
                  },
                },
                'Status: Expired': {
                  summary: 'Transaction has expired',
                  value: {
                    requestId: 'req_123456',
                    systemReference: 'SYS-BTC-12345',
                    orderId: '87G2A1',
                    status: 'transfer.expired',
                    fiatAmount: 100.50,
                    fiatCurrency: 'EUR',
                    cryptoAmount: 0.0025,
                    cryptoCurrency: 'BTC',
                    createdAt: '2026-03-03T17:00:00.000Z',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Webhook received successfully',
          },
        },
      },
    },
  };

  // Extract schemas from paths
  Object.keys(checkoutDocument.paths).forEach((path) => {
    // Exclude S2S, summary, details, and health endpoints
    if (
      !path.includes('/accept/') &&
      !path.includes('/summary') &&
      !path.includes('/details') &&
      !path.includes('/health')
    ) {
      filteredCheckoutPaths[path] = checkoutDocument.paths[path];
      extractRefs(checkoutDocument.paths[path]);
    }
  });

  // Extract schemas from webhooks
  extractRefs(webhooks);

  checkoutDocument.paths = filteredCheckoutPaths;
  (checkoutDocument as any).webhooks = webhooks;

  // Recursively find dependencies for used schemas
  const resolveSchemaDependencies = () => {
    let addedNew = false;
    usedSchemas.forEach((schemaName) => {
      const schema = checkoutDocument.components?.schemas?.[schemaName];
      if (schema) {
        const beforeCount = usedSchemas.size;
        extractRefs(schema);
        if (usedSchemas.size > beforeCount) {
          addedNew = true;
        }
      }
    });
    if (addedNew) {
      resolveSchemaDependencies();
    }
  };
  resolveSchemaDependencies();

  // Filter components.schemas
  const schemas = checkoutDocument.components?.schemas;
  if (schemas) {
    const filteredSchemas: Record<string, any> = {};
    Object.keys(schemas).forEach((schemaName) => {
      if (usedSchemas.has(schemaName)) {
        filteredSchemas[schemaName] = schemas[schemaName];
      }
    });
    checkoutDocument.components!.schemas = filteredSchemas;
  }

  // Force OpenAPI 3.1.0 to support the 'webhooks' property
  checkoutDocument.openapi = '3.1.0';

  // Dynamic JSON endpoint: server URL is derived from the incoming request host
  // const httpAdapter = app.getHttpAdapter();
  // const docsJsonPath = `/${API_CONFIG.CHECKOUT.DOCS}-json`;
  const docsPath = API_CONFIG.CHECKOUT.DOCS;

  // httpAdapter.get(docsJsonPath, (req: any, res: any) => {
  //   const protocol =
  //     req.headers['x-forwarded-proto'] || req.protocol || 'https';
  //   const host = req.headers.host;
  //   const basePath = process.env.SWAGGER_BASE_PATH || '';
  //   res.json({
  //     ...checkoutDocument,
  //     servers: [{ url: `${protocol}://${host}${basePath}` }],
  //   });
  // });

  // SwaggerModule.setup(docsPath, app, checkoutDocument, {
  //   swaggerOptions: { url: docsJsonPath },
  // });

  SwaggerModule.setup(docsPath, app, checkoutDocument);
}
