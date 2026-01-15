import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  app.setGlobalPrefix('api/v1/');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_DOMAIN_ORIGIN,
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    credentials: true,
  });

  // Socket.IO CORS
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('My API')
    .addServer(`${process.env.BACKEND_DOMAIN}`)
    .setDescription('API docs for my NestJS app')
    .setVersion('1.0')
    // .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();

  // Register only the models you want
  const document = SwaggerModule.createDocument(app, config);
  // Keep schemas for reference resolution, but you can filter specific ones if needed
  // delete document.components?.schemas; // removes the Schemas section

  SwaggerModule.setup('api', app, document);

  const port = process.env.APP_PORT || 3000;

  await app.listen(port, "127.0.0.1");
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api`);
}
void bootstrap();
