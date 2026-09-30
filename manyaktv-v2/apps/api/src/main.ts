import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import * as path from 'path';
import { AppModule } from './app.module';

/** Oddiy xotiradagi rate-limit: bir IP dan juda kop sorovni toxtatadi */
function createRateLimiter() {
  const hits = new Map<string, { n: number; t: number }>();
  const WINDOW = 60000;
  const timer = setInterval(() => {
    const now = Date.now();
    hits.forEach((v, k) => { if (now - v.t > WINDOW * 2) { hits.delete(k); } });
  }, WINDOW);
  if (typeof (timer as any).unref === 'function') { (timer as any).unref(); }

  return (req: any, res: any, next: any) => {
    const url = String(req.originalUrl || req.url || '');
    if (
      url.indexOf('/uploads') === 0 ||
      url.indexOf('webhook') >= 0 ||
      url.indexOf('/health') >= 0 ||
      url.indexOf('/events') >= 0 ||
      url.indexOf('/stream') >= 0
    ) {
      return next();
    }
    const fwd = String(req.headers && req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : '');
    const ip = (fwd.split(',')[0] || req.ip || 'x').trim();
    const isAuth = url.indexOf('/auth/') >= 0;
    const key = (isAuth ? 'a:' : 'g:') + ip;
    const limit = isAuth ? 60 : 1200;
    const now = Date.now();
    let h = hits.get(key);
    if (!h || now - h.t > WINDOW) {
      h = { n: 0, t: now };
      hits.set(key, h);
    }
    h.n++;
    if (h.n > limit) {
      res.status(429).json({ statusCode: 429, message: 'Juda kop sorov. Birozdan keyin urinib koring.' });
      return;
    }
    next();
  };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3001);
  const nodeEnv = config.get<string>('app.nodeEnv', 'development');

  // Render proksi ortida: haqiqiy IP ni olish uchun
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());
  app.use(createRateLimiter());

  // Yuklangan poster/video/chek fayllarini ochiq berish
  app.useStaticAssets(path.resolve(process.env.UPLOADS_DIR || './uploads'), {
    prefix: '/uploads',
    dotfiles: 'deny',
    index: false,
  });

  // CORS: faqat bizning web ilovamiz (WEBAPP_URL) va localhost
  const allowed = new Set<string>(
    [
      process.env.WEBAPP_URL,
      process.env.FRONTEND_URL,
      'https://manyaktv-web1.onrender.com',
    ]
      .concat(String(process.env.CORS_ORIGINS || '').split(','))
      .map((s) => String(s || '').trim().replace(/\/+$/, ''))
      .filter((s) => !!s),
  );
  app.enableCors({
    origin: (origin: any, cb: any) => {
      if (!origin) { return cb(null, true); }
      const o = String(origin).replace(/\/+$/, '');
      if (allowed.has(o) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ManyakTV API')
      .setDescription('Telegram Kino Web App REST API')
      .setVersion('2.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port, '0.0.0.0');
  console.log(`MANYAK TV API v2 running on port ${port} [${nodeEnv}]`);
}

bootstrap();
