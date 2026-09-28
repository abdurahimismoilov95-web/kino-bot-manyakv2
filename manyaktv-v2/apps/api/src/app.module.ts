import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import telegramConfig from './config/telegram.config';
import storageConfig from './config/storage.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContentModule } from './modules/content/content.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { BotModule } from './modules/bot/bot.module';
import { VerifyModule } from './modules/verify/verify.module';
import { AdminModule } from './modules/admin/admin.module';
import { EventsModule } from './modules/events/events.module';
import { UploadModule } from './modules/upload/upload.module';
import { HealthModule } from './modules/health/health.module';

/** true/1/yes -> true */
function envFlag(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, telegramConfig, storageConfig],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const url =
          process.env.DATABASE_URL || config.get<string>('database.url') || '';

        if (!url) {
          throw new Error(
            'DATABASE_URL topilmadi. Render dashboard -> manyaktv-api -> Environment ga ' +
              'Postgres Internal Database URL ni DATABASE_URL nomi bilan qoshing.',
          );
        }

        // Renderning tashqi (external) hosti SSL talab qiladi, internal host talab qilmaydi.
        const needsSsl =
          envFlag(process.env.DB_SSL) ||
          /[.]render[.]com/.test(url) ||
          url.includes('sslmode=require');

        const isProd = (process.env.NODE_ENV || 'development') === 'production';

        return {
          type: 'postgres' as const,
          url,
          autoLoadEntities: true,
          // Birinchi deployda jadvallarni yaratish uchun DB_SYNCHRONIZE=true qoyiladi.
          synchronize: envFlag(process.env.DB_SYNCHRONIZE, !isProd),
          logging: !isProd,
          retryAttempts: 10,
          retryDelay: 3000,
          ssl: needsSsl ? { rejectUnauthorized: false } : false,
          extra: {
            max: Number(process.env.DB_POOL_MAX || 10),
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
          },
        };
      },
      inject: [ConfigService],
    }),

    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const redisUrl =
          process.env.REDIS_URL || config.get<string>('app.redis.url');
        return redisUrl
          ? { redis: redisUrl }
          : {
              redis: {
                host: config.get<string>('app.redis.host', 'localhost'),
                port: config.get<number>('app.redis.port', 6379),
              },
            };
      },
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),

    EventEmitterModule.forRoot({ wildcard: true }),

    AuthModule,
    UsersModule,
    ContentModule,
    PaymentModule,
    SubscriptionModule,
    StreamingModule,
    VerifyModule,
    BotModule,
    AdminModule,
    EventsModule,
    UploadModule,
    HealthModule,
  ],
})
export class AppModule {}
