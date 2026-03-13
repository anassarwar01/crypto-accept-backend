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
import { setupCheckoutSwagger } from './config/swagger/checkout.swagger';
import { setupS2SSwagger } from './config/swagger/s2s.swagger';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { AcceptTransactionsModule } from './modules/transactions/S2S/accept-transactions.module';
import helmet from 'helmet';
import basicAuth from 'express-basic-auth';

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
    exclude: ['webhooks/(.*)', 'api/accept/v1/(.*)'],
  });

  /**
   * -------------------------------------------------------
   * CORS Configuration
   * -------------------------------------------------------
   * - Development: allow all origins
   * - Production: restrict to FRONTEND_ORIGIN (comma-separated)
   */

  const isDevelopment = process.env.APP_ENV === 'development';

  app.enableCors({
    origin: isDevelopment
      ? '*'
      : process.env.FRONTEND_ORIGIN?.split(',') || [],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: !isDevelopment, // disable credentials when using *
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

  app.use(
    ['/docs', '/docs-json', '/checkout', '/checkout-json'],
    basicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_USER || 'admin']: process.env.SWAGGER_PASSWORD || 'password',
      },
    }),
  );

  // Checkout API Documentation
  setupCheckoutSwagger(app);

  // S2S API Documentation
  setupS2SSwagger(app);

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