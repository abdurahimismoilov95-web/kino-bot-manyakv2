/**
 * BotModule - API tarafida Telegram webhook qabul qilish.
 * Bot logikasi alohida microservice (apps/bot) da ishlaydi.
 */
import { Module } from '@nestjs/common';
import { BotWebhookController } from './bot-webhook.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [BotWebhookController],
})
export class BotModule {}
