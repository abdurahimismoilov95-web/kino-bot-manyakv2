import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3001);
  const nodeEnv = config.get<string>('app.nodeEnv', 'development');

  // ─── Security Middlewares ───────────────────────────────────────
  app.use(
    helmet({
      // HLS stream response'lar uchun Content-Security-Policy bo'shatildi
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());

  // ─── CORS ────────────────────────────────────────────────────
  app.enableCors({
    origin: config.get<string>('app.frontendUrl', '*'),
    credentials: true,
  });

  // ─── Global Validation Pipe ──────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // DTO'da bo'lmagan field'larni olib tashlaydi
      forbidNonWhitelisted: true, // Noto'g'ri field bo'lsa 400 qaytaradi
      transform: true,       // String → number/boolean avtomatik transform
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── API Versioning ──────────────────────────────────────────────
  app.enableVersioning({
    type: VersioningType.URI, // /api/v1/...
    prefix: 'v',
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  // ─── Swagger (Development only) ───────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ManyakTV API')
      .setDescription('Telegram Kino Web App REST API')
      .setVersion('2.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    console.log(`Swagger: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║  MANYAK TV API v2  [•] Running   ║`);
  console.log(`║  Port : ${port.toString().padEnd(26)}║`);
  console.log(`║  Env  : ${nodeEnv.padEnd(26)}║`);
  console.log(`╚══════════════════════════════════════╝\n`);
}

bootstrap();
