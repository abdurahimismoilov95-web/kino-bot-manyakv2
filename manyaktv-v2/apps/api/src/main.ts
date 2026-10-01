import { NestFactory } from '@nestjs/core';
import { LogLevel, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import * as path from 'path';
import { AppModule } from './app.module';

const IS_PROD =
  (process.env.NODE_ENV || (process.env.RENDER ? 'production' : 'development')) === 'production';

/** /uploads dan faqat shu turdagi fayllar beriladi (html, svg, js va h.k. hech qachon) */
const ALLOWED_UPLOAD_EXT = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif',
  '.mp4', '.webm', '.mov', '.mkv', '.m4v', '.avi', '.ts', '.m3u8',
]);

/**
 * Ishga tushishdan oldin xavfsizlik sozlamalarini tekshiradi.
 * Productionda jiddiy xato bo'lsa server ishga tushmaydi (xavfli holatda ishlamasligi uchun).
 */
function checkSecurityConfig(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  const jwt = process.env.JWT_SECRET || '';
  if (!jwt) errors.push('JWT_SECRET qo\'yilmagan');
  else if (jwt.length < 32) errors.push('JWT_SECRET juda qisqa (kamida 32 belgi kerak)');

  if (!process.env.TELEGRAM_BOT_TOKEN) errors.push('TELEGRAM_BOT_TOKEN qo\'yilmagan');
  if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
    errors.push('TELEGRAM_WEBHOOK_SECRET qo\'yilmagan - webhook himoyasiz (soxta kontakt yuborish mumkin)');
  }
  if (!process.env.SUPER_ADMIN_ID) warnings.push('SUPER_ADMIN_ID qo\'yilmagan - bosh admin bo\'lmaydi');

  const abs = process.env.ADMIN_BROWSER_SECRET || '';
  if (abs && abs.length < 16) warnings.push('ADMIN_BROWSER_SECRET 16 belgidan qisqa - brauzer orqali admin kirishi o\'chirildi');

  const fss = process.env.FILE_SIGNING_SECRET || '';
  if (!fss) warnings.push('FILE_SIGNING_SECRET qo\'yilmagan - har ishga tushishda tasodifiy sir ishlatiladi');
  else if (fss.length < 32) warnings.push('FILE_SIGNING_SECRET juda qisqa (kamida 32 belgi tavsiya etiladi)');

  const sync = String(process.env.DB_SYNCHRONIZE || '').toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(sync)) {
    warnings.push('DB_SYNCHRONIZE yoqilgan - jadval tuzilmasi avtomatik o\'zgaradi, ma\'lumot yo\'qolishi mumkin');
  }
  if (!process.env.NODE_ENV) warnings.push('NODE_ENV qo\'yilmagan - Render sababli production deb olindi');

  warnings.forEach((w) => console.warn('[XAVFSIZLIK] Ogohlantirish: ' + w));
  if (errors.length) {
    errors.forEach((e) => console.error('[XAVFSIZLIK] Xato: ' + e));
    if (IS_PROD) {
      throw new Error('Xavfsizlik sozlamalari noto\'g\'ri: ' + errors.join('; '));
    }
  }
}

/**
 * Oddiy xotiradagi rate-limit: bir IP dan juda kop sorovni toxtatadi.
 * Faqat yo'l (path) tekshiriladi - so'rov satriga "?webhook" qo'shib cheklovni aylanib o'tib bo'lmaydi.
 */
function createRateLimiter() {
  const hits = new Map<string, { n: number; t: number }>();
  const WINDOW = 60000;
  const MAX_KEYS = 50000;
  const timer = setInterval(() => {
    const now = Date.now();
    hits.forEach((v, k) => { if (now - v.t > WINDOW * 2) { hits.delete(k); } });
  }, WINDOW);
  if (typeof (timer as any).unref === 'function') { (timer as any).unref(); }

  return (req: any, res: any, next: any) => {
    const p = String(req.path || '').toLowerCase();
    if (
      p.startsWith('/uploads/') ||
      p === '/api/v1/bot/webhook' ||
      p.startsWith('/api/v1/health') ||
      p.startsWith('/api/v1/events') ||
      p === '/api/v1/streaming/auth'
    ) {
      return next();
    }
    // trust proxy=1 bo'lgani uchun req.ip Render proksisi bergan haqiqiy IP
    const ip = String(req.ip || 'x').trim();
    const isAdminLogin = p.startsWith('/api/v1/auth/admin');
    const isAuth = p.startsWith('/api/v1/auth/') || p.startsWith('/api/v1/verify');
    const isUpload = p.startsWith('/api/v1/upload/receipt');
    const key = (isAdminLogin ? 'l:' : isUpload ? 'u:' : isAuth ? 'a:' : 'g:') + ip;
    // Admin parol bilan kirishga daqiqasiga 5 ta urinish (sirni taxmin qilishdan himoya)
    const limit = isAdminLogin ? 5 : isUpload ? 10 : isAuth ? 60 : 1200;
    const now = Date.now();
    let h = hits.get(key);
    if (!h || now - h.t > WINDOW) {
      if (hits.size > MAX_KEYS) hits.clear();
      h = { n: 0, t: now };
      hits.set(key, h);
    }
    h.n++;
    if (h.n > limit) {
      res.setHeader('Retry-After', '60');
      res.status(429).json({ statusCode: 429, message: 'Juda kop sorov. Birozdan keyin urinib koring.' });
      return;
    }
    next();
  };
}

async function bootstrap() {
  checkSecurityConfig();

  const logLevels: LogLevel[] = IS_PROD ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug'];
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logLevels,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3001);
  const nodeEnv = config.get<string>('app.nodeEnv', 'development');

  // Render proksi ortida: haqiqiy IP ni olish uchun
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: IS_PROD ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: IS_PROD ? { maxAge: 31536000, includeSubDomains: true } : false,
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.use(compression());
  app.use(createRateLimiter());

  // /uploads: faqat rasm va video turlari, boshqa har qanday fayl 404
  app.use('/uploads', (req: any, res: any, next: any) => {
    const ext = path.extname(String(req.path || '')).toLowerCase();
    if (!ALLOWED_UPLOAD_EXT.has(ext) || String(req.path || '').indexOf('..') >= 0) {
      res.status(404).end();
      return;
    }
    next();
  });

  // Yuklangan poster/video/chek fayllarini berish
  app.useStaticAssets(path.resolve(process.env.UPLOADS_DIR || './uploads'), {
    prefix: '/uploads',
    dotfiles: 'deny',
    index: false,
    redirect: false,
    setHeaders: (res: any, filePath: string) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // Fayl brauzerda sahifa sifatida ochilsa ham hech qanday skript ishlamaydi
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; media-src 'self'; sandbox");
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      if (String(filePath).indexOf('receipts') >= 0) {
        // To'lov cheklari keshlanmaydi
        res.setHeader('Cache-Control', 'private, no-store');
      }
    },
  });

  // CORS: faqat bizning web ilovamiz. localhost faqat lokal ishlab chiqishda ruxsat etiladi.
  const allowed = new Set<string>(
    [
      process.env.WEBAPP_URL,
      process.env.FRONTEND_URL,
      'https://manyaktv-web1.onrender.com',
    ]
      .concat(String(process.env.CORS_ORIGINS || '').split(','))
      .map((s) => String(s || '').trim().replace(/\/+$/, ''))
      .filter((s) => !!s && (!IS_PROD || s.indexOf('localhost') < 0)),
  );
  app.enableCors({
    origin: (origin: any, cb: any) => {
      // Origin'siz so'rovlar (Telegram webhook, server-server) - CORS ularga taalluqli emas
      if (!origin) { return cb(null, true); }
      const o = String(origin).replace(/\/+$/, '');
      if (allowed.has(o)) { return cb(null, true); }
      if (!IS_PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    maxAge: 600,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: false,
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  // Swagger hujjatlari faqat lokal ishlab chiqishda (productionda API tuzilmasi ochilmaydi)
  if (!IS_PROD) {
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
