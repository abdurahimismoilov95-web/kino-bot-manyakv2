/**
 * BotModule — API tarafida Telegram webhook qabul qilish.
 * Bot logikasi ALOHIDA microservice'da (apps/bot) ishlaydi.
 * Bu modul faqat webhook endpoint'ni ochadi va Redis orqali
 * bot service'ga event yuboradi.
 */
import { Module } from '@nestjs/common';
import { BotWebhookController } from './bot-webhook.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [BotWebhookController],
})
export class BotModule {}
