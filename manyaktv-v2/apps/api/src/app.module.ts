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
import { AdminModule } from './modules/admin/admin.module';
import { EventsModule } from './modules/events/events.module';
import { UploadModule } from './modules/upload/upload.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, telegramConfig, storageConfig],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('database.url'),
        autoLoadEntities: true,
        synchronize: config.get('app.nodeEnv') !== 'production',
        logging: config.get('app.nodeEnv') === 'development',
        ssl: config.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false,
        extra: {
          max: 10,
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
        },
      }),
      inject: [ConfigService],
    }),

    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('app.redis.url') || {
          host: config.get<string>('app.redis.host', 'localhost'),
          port: config.get<number>('app.redis.port', 6379),
        },
      }),
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
    BotModule,
    AdminModule,
    EventsModule,
    UploadModule,
    HealthModule,
  ],
})
export class AppModule {}
