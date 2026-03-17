import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AcceptTransactionsModule } from '../../modules/transactions/S2S/accept-transactions.module';
import { API_CONFIG } from '../api.config';

export function setupS2SSwagger(app: INestApplication): void {
  const s2sConfig = new DocumentBuilder()
    .setTitle('Merchant Transaction API Documentation')
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-api-key', in: 'header' },
      'x-api-key',
    )
    // No hardcoded server — resolved dynamically per request
    .build();

  const s2sDocument = SwaggerModule.createDocument(app, s2sConfig, {
    include: [AcceptTransactionsModule],
  });

  // Force OpenAPI 3.1.0 to support the 'webhooks' property
  s2sDocument.openapi = '3.1.0';

  // Manually add webhooks documentation as it's not yet supported by decorators in this version
  (s2sDocument as any).webhooks = {
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

  /**
   * Filter S2S endpoints to only expose \`/accept/\` routes
   */
  const filteredPaths = {};
  Object.keys(s2sDocument.paths).forEach((path) => {
    if (path.includes('/accept/')) {
      filteredPaths[path] = s2sDocument.paths[path];
    }
  });

  s2sDocument.paths = filteredPaths;

  // Dynamic JSON endpoint: server URL is derived from the incoming request host
  const httpAdapter = app.getHttpAdapter();
  const docsJsonPath = `/${API_CONFIG.ACCEPT.DOCS}-json`;
  const docsPath = API_CONFIG.ACCEPT.DOCS;

  httpAdapter.get(docsJsonPath, (req: any, res: any) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers.host;
    res.json({
      ...s2sDocument,
      servers: [{ url: `${protocol}://${host}` }],
    });
  });

  // Swagger UI fetches its spec from the dynamic endpoint above
  SwaggerModule.setup(docsPath, app, s2sDocument, {
    swaggerOptions: { url: docsJsonPath },
  });
}
