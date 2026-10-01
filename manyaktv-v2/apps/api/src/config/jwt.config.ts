import { registerAs } from '@nestjs/config';
import * as crypto from 'crypto';

const isProd =
  (process.env.NODE_ENV || (process.env.RENDER ? 'production' : 'development')) === 'production';

// Productionda JWT_SECRET majburiy (main.ts da tekshiriladi).
// Lokal ishlab chiqishda yo'q bo'lsa, har ishga tushishda tasodifiy sir yaratiladi.
const devFallback = isProd ? '' : crypto.randomBytes(32).toString('hex');

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || devFallback,
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
}));
