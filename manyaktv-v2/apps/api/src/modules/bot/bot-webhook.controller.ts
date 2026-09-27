import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventsService } from '../events/events.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller({ path: 'bot', version: '1' })
export class BotWebhookController {
  constructor(
    private readonly config: ConfigService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * POST /api/v1/bot/webhook
   * X-Telegram-Bot-Api-Secret-Token header bilan himoyalangan.
   */
  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() update: unknown,
    @Headers('x-telegram-bot-api-secret-token') secret: string,
  ) {
    const expected = this.config.get<string>('telegram.webhookSecret');
    if (secret !== expected) return { ok: false };

    await this.eventsService.broadcast('telegram.update', update);
    return { ok: true };
  }
}
