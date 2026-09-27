/**
 * BotModule - Telegram webhook qabul qilish va javob yozish.
 */
import { Module } from '@nestjs/common';
import { BotWebhookController } from './bot-webhook.controller';
import { BotService } from './bot.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [BotWebhookController],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
