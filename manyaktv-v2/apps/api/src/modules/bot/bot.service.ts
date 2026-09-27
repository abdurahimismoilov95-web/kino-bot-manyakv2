import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    from?: { id?: number; first_name?: string };
    text?: string;
  };
  callback_query?: {
    id?: string;
    from?: { id?: number };
    data?: string;
  };
};

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(private readonly config: ConfigService) {}

  private get token(): string {
    return (
      this.config.get<string>('telegram.botToken') ||
      process.env.TELEGRAM_BOT_TOKEN ||
      ''
    );
  }

  private get webAppUrl(): string {
    return process.env.WEBAPP_URL || process.env.FRONTEND_URL || '';
  }

  /** Telegram Bot API ga sorov yuborish */
  private async call(method: string, payload: unknown): Promise<void> {
    if (!this.token) {
      this.logger.error('TELEGRAM_BOT_TOKEN topilmadi');
      return;
    }

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${this.token}/${method}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        this.logger.warn(`${method} xato: ${res.status} ${await res.text()}`);
      }
    } catch (err) {
      this.logger.error(`${method} yuborilmadi`, err as Error);
    }
  }

  private async sendMessage(
    chatId: number,
    text: string,
    replyMarkup?: unknown,
  ): Promise<void> {
    await this.call('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });
  }

  /** Asosiy menyu tugmalari */
  private mainKeyboard() {
    const rows: Array<Array<Record<string, unknown>>> = [];

    if (this.webAppUrl) {
      rows.push([
        { text: 'Kinolarni korish', web_app: { url: this.webAppUrl } },
      ]);
    }

    rows.push([
      { text: 'Tariflar', callback_data: 'plans' },
      { text: 'Yordam', callback_data: 'help' },
    ]);

    return { inline_keyboard: rows };
  }

  /** Webhook dan kelgan update ni qayta ishlash */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    if (update.callback_query) {
      const { id, data, from } = update.callback_query;
      const chatId = from?.id;

      await this.call('answerCallbackQuery', { callback_query_id: id });

      if (!chatId) return;

      if (data === 'plans') {
        await this.sendMessage(
          chatId,
          '<b>Tariflar</b>\n\nObuna rejalari va narxlar ilova ichida korsatilgan. Pastdagi tugma orqali oching.',
          this.mainKeyboard(),
        );
      } else if (data === 'help') {
        await this.sendMessage(
          chatId,
          '<b>Yordam</b>\n\n/start - botni qayta ishga tushirish\n\nSavollar boyicha administratorga yozing.',
        );
      }
      return;
    }

    const message = update.message;
    const chatId = message?.chat?.id;
    if (!chatId) return;

    const text = (message?.text || '').trim();
    const name = message?.from?.first_name || 'dost';

    if (text.startsWith('/start')) {
      await this.sendMessage(
        chatId,
        `Salom, <b>${name}</b>!\n\n<b>MANYAK TV</b> ga xush kelibsiz.\n\nKinolar, seriallar, anime va qisqa dramalar - hammasi bir joyda.\n\nBoshlash uchun pastdagi tugmani bosing.`,
        this.mainKeyboard(),
      );
      return;
    }

    if (text.startsWith('/help')) {
      await this.sendMessage(
        chatId,
        '<b>Yordam</b>\n\n/start - asosiy menyu\n/help - yordam\n\nKino qidirish uchun ilovani ochib, qidiruv boliminan foydalaning.',
        this.mainKeyboard(),
      );
      return;
    }

    await this.sendMessage(
      chatId,
      'Buyruq tushunilmadi. Asosiy menyu uchun /start bosing.',
      this.mainKeyboard(),
    );
  }
}
