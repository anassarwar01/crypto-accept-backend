/**
 * -------------------------------------------------------
 * Application Bootstrap File (main.ts)
 * -------------------------------------------------------
 * - Sets global environment configuration
 * - Applies security best practices
 * - Configures validation, CORS, WebSockets
 * - Mounts Swagger documentation (non-production)
 * -------------------------------------------------------
 */

/**
 * Force application & PostgreSQL timezone to UTC.
 * Recommended for distributed systems and financial apps.
 * Prefer setting this at infrastructure level (Docker/PM2).
 */
process.env.TZ = 'UTC';
process.env.PGTZ = 'UTC';

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { AcceptTransactionsModule } from './modules/transactions/S2S/accept-transactions.module';
import helmet from 'helmet';

async function bootstrap() {
  /**
   * -------------------------------------------------------
   * Create NestJS Application
   * -------------------------------------------------------
   */
  const app = await NestFactory.create(AppModule);

  /**
   * -------------------------------------------------------
   * Trust Proxy Configuration
   * -------------------------------------------------------
   * Required when running behind:
   * - Nginx
   * - Cloudflare
   * - AWS ELB / ALB
   * Enables correct client IP detection.
   */
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  /**
   * -------------------------------------------------------
   * Security Headers
   * -------------------------------------------------------
   * Adds common security headers:
   * - XSS protection
   * - HSTS
   * - Frameguard
   * - Content Security Policy
   */
  app.use(helmet());

  /**
   * -------------------------------------------------------
   * Enforce HTTPS (Production Only)
   * -------------------------------------------------------
   * Redirect HTTP → HTTPS when behind a reverse proxy.
   */
  if (process.env.APP_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(`https://${req.headers.host}${req.url}`);
      }
      next();
    });
  }

  /**
   * -------------------------------------------------------
   * Global Validation
   * -------------------------------------------------------
   * - whitelist: strips unknown properties
   * - forbidNonWhitelisted: rejects unexpected fields
   * - transform: auto-converts payloads to DTO types
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * Allow class-validator to use NestJS dependency injection
   */
  const { useContainer } = require('class-validator');
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  /**
   * -------------------------------------------------------
   * Global API Prefix
   * -------------------------------------------------------
   * All routes prefixed with:
   * /api/v1
   * Excluding webhooks (often required externally).
   */
  app.setGlobalPrefix('api/v1', {
    exclude: ['webhooks/(.*)'],
  });

  /**
   * -------------------------------------------------------
   * CORS Configuration
   * -------------------------------------------------------
   * - Development: allow all origins
   * - Production: restrict to FRONTEND_DOMAIN (comma-separated)
   */
  const isDevelopment = process.env.APP_ENV === 'development';

  if (!isDevelopment && !process.env.FRONTEND_DOMAIN) {
    throw new Error('FRONTEND_DOMAIN must be defined in production');
  }

  app.enableCors({
    origin: isDevelopment
      ? '*'
      : process.env.FRONTEND_DOMAIN?.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  /**
   * -------------------------------------------------------
   * WebSocket Adapter
   * -------------------------------------------------------
   * Enables Socket.IO support.
   * Ensure reverse proxy forwards upgrade headers.
   */
  app.useWebSocketAdapter(new IoAdapter(app));

  /**
   * -------------------------------------------------------
   * Swagger Documentation (Non-Production Only)
   * -------------------------------------------------------
   * For security reasons, documentation is disabled in production.
   * If needed in production, protect with:
   * - Basic Auth
   * - IP Whitelisting
   */
  if (process.env.APP_ENV !== 'production') {
    /**
     * Checkout API Documentation
     */
    const checkoutConfig = new DocumentBuilder()
      .setTitle('Checkout API Documentation')
      .setDescription('Public Checkout APIs')
      .setVersion('1.0')
      .addServer(process.env.BACKEND_DOMAIN || 'http://localhost:3000')
      .build();

    const checkoutDocument = SwaggerModule.createDocument(
      app,
      checkoutConfig,
    );

    // SwaggerModule.setup('checkout', app, checkoutDocument);

    /**
     * S2S (Server-to-Server) Documentation
     * Only includes TransactionsModule
     */
    const s2sConfig = new DocumentBuilder()
      .setTitle('Merchant Transaction API Documentation')
      .setDescription('This is a pre-release BETA version of the API for the purposes of early visibility of merchants who are starting integration work.')
      .setVersion('1.0')
      .addApiKey(
        { type: 'apiKey', name: 'x-api-key', in: 'header' },
        'x-api-key',
      )
      .addServer(process.env.BACKEND_DOMAIN || 'http://localhost:3000')
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
                  $ref: '#/components/schemas/MerchantWebhookPayloadDto'
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
                      createdAt: '2026-03-03T17:00:00.000Z'
                    }
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
                      createdAt: '2026-03-03T17:00:00.000Z'
                    }
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
                      createdAt: '2026-03-03T17:00:00.000Z'
                    }
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
                      createdAt: '2026-03-03T17:00:00.000Z'
                    }
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
                      createdAt: '2026-03-03T17:00:00.000Z'
                    }
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
                      createdAt: '2026-03-03T17:00:00.000Z'
                    }
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
                      createdAt: '2026-03-03T17:00:00.000Z'
                    }
                  },
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Webhook received successfully'
            }
          }
        }
      }
    };

    /**
     * Filter S2S endpoints to only expose `/accept/` routes
     */
    const filteredPaths = {};
    Object.keys(s2sDocument.paths).forEach((path) => {
      if (path.includes('/accept/')) {
        filteredPaths[path] = s2sDocument.paths[path];
      }
    });

    s2sDocument.paths = filteredPaths;


    SwaggerModule.setup('s2s', app, s2sDocument);
  }

  /**
   * -------------------------------------------------------
   * Start Application
   * -------------------------------------------------------
   */
  const port = process.env.APP_PORT || 3000;
  await app.listen(port);

  console.log(`Server running on port ${port}`);
}

void bootstrap();