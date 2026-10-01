import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { EventsService } from '../events/events.service';
import { BotService } from './bot.service';
import { Public } from '../../common/decorators/public.decorator';

const IS_PROD =
  (process.env.NODE_ENV || (process.env.RENDER ? 'production' : 'development')) === 'production';

/** Vaqtga bog'liq hujumdan himoyalangan solishtirish */
function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

@Controller({ path: 'bot', version: '1' })
export class BotWebhookController {
  private readonly logger = new Logger(BotWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly eventsService: EventsService,
    private readonly botService: BotService,
  ) {}

  /**
   * POST /api/v1/bot/webhook
   * X-Telegram-Bot-Api-Secret-Token header bilan himoyalangan.
   * Productionda sir qo'yilmagan bo'lsa, hech qanday update qabul qilinmaydi
   * (aks holda har kim soxta "kontakt" yuborib hisobni tasdiqlab olishi mumkin edi).
   */
  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() update: Record<string, unknown>,
    @Headers('x-telegram-bot-api-secret-token') secret: string,
  ) {
    const expected =
      this.config.get<string>('telegram.webhookSecret') || process.env.TELEGRAM_WEBHOOK_SECRET || '';

    if (!expected) {
      if (IS_PROD) {
        this.logger.warn('Webhook rad etildi: TELEGRAM_WEBHOOK_SECRET qo\'yilmagan');
        return { ok: false };
      }
    } else if (!safeEqual(secret, expected)) {
      this.logger.warn('Webhook rad etildi: noto\'g\'ri secret token');
      return { ok: false };
    }

    if (!update || typeof update !== 'object') return { ok: true };

    // Foydalanuvchiga javob yozish (xato bo'lsa ham Telegramga 200 qaytadi - qayta yuborish tsikli bo'lmasin)
    try {
      await this.botService.handleUpdate(update);
    } catch (err) {
      this.logger.error('Update qayta ishlanmadi', err as Error);
    }

    // Real-time kuzatuvchilarga uzatish (xato bolsa webhook yiqilmasin)
    try {
      await this.eventsService.broadcast('telegram.update', update);
    } catch {
      // e'tiborsiz
    }

    return { ok: true };
  }
}
