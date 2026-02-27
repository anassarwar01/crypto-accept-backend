process.env.TZ = 'UTC';
process.env.PGTZ = 'UTC';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable trust proxy for being behind reverse proxies (like Nginx, ngrok, etc.)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const { useContainer } = require('class-validator');
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Global prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['webhooks/(.*)'],
  });

  // CORS
  const isDevelopment = process.env.NODE_ENV === 'development';
  app.enableCors({
    origin: isDevelopment ? '*' : process.env.FRONTEND_DOMAIN?.split(',') || [],
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    credentials: true,
  });

  // Socket.IO CORS
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Checkout API Documentation')
    .addServer(`${process.env.BACKEND_DOMAIN}`)
    .setDescription('API docs for Checkout')
    .setVersion('1.0')
    // .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();

  // Register only the models you want
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('checkout', app, document, {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js',
    ],
  });

  // Robust middleware to redirect /api to /api/ while preserving proxy subpaths
  // app.use('/api', (req, res, next) => {
  //   if ((req.path === '/' || req.path === '') && !req.originalUrl.endsWith('/')) {
  //     return res.redirect(301, req.originalUrl + '/');
  //   }
  //   next();
  // });

  SwaggerModule.setup('backend/api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      // Force relative URL for the spec to help UI find it regardless of subpath
      url: './api-json',
    },
    customSiteTitle: 'My API Docs',
    // Use relative paths for assets to ensure they resolve correctly behind a proxy
    customCssUrl: './swagger-ui.css',
    customJs: [
      './swagger-ui-bundle.js',
      './swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env.APP_PORT || 3000;

  await app.listen(port, "127.0.0.1");
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api`);
}
void bootstrap();
