/**
 * MANYAK TV Bot Microservice
 * 
 * Bu alohida process - NestJS API dan butunlay ajratilgan.
 * Redis orqali API bilan muloqot qiladi:
 *   - telegram.update event'larini tinglaydi
 *   - Payment approved/rejected bildirishnomalarini yuboradi
 *   - Admin buyruqlari
 */
import { NestFactory } from '@nestjs/core';
import { BotAppModule } from './bot-app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(BotAppModule, {
    logger: ['error', 'warn', 'log'],
  });

  await app.init();
  console.log('[Bot] Manyak TV Bot microservice started');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[Bot] SIGTERM received, shutting down...');
    await app.close();
    process.exit(0);
  });
}

bootstrap();
