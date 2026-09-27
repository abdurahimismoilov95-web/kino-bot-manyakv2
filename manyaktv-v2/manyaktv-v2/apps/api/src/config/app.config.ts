import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv:     process.env.NODE_ENV || 'development',
  port:        parseInt(process.env.PORT || '3001', 10),
  appUrl:      process.env.APP_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  // Admin brauzer orqali kirish uchun maxfiy kod (env da ADMIN_BROWSER_SECRET)
  adminBrowserSecret: process.env.ADMIN_BROWSER_SECRET || '',
  redis: {
    host:     process.env.REDIS_HOST || 'localhost',
    port:     parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    url:      process.env.REDIS_URL,
  },
}));
