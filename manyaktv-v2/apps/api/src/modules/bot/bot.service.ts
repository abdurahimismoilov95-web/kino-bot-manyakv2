import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

/** Render static site manzili. WEBAPP_URL env bolmasa shu ishlatiladi. */
const DEFAULT_WEBAPP_URL = 'https://manyaktv-web1.onrender.com';

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
    const url = (
      process.env.WEBAPP_URL ||
      process.env.FRONTEND_URL ||
      DEFAULT_WEBAPP_URL
    ).trim();
    return url.replace(/\/+$/, '');
  }

  /** Telegram Bot API ga sorov yuborish */
  private async call(method: string, payload: unknown): Promise<void> {
    const token = this.token;
    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN topilmadi');
      return;
    }

    const url = TELEGRAM_API_BASE + '/bot' + token + '/' + method;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text();
        this.logger.warn(method + ' xato: ' + res.status + ' ' + body);
      }
    } catch (err) {
      this.logger.error(method + ' yuborilmadi', err as Error);
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
    const base = this.webAppUrl;
    const rows: Array<Array<Record<string, unknown>>> = [];

    rows.push([
      { text: 'MANYAK TV ni ochish', web_app: { url: base } },
    ]);

    rows.push([
      { text: 'Qidirish', web_app: { url: base + '/search' } },
      { text: 'Mini dramalar', web_app: { url: base + '/shorts' } },
    ]);

    rows.push([
      { text: 'Tariflar', web_app: { url: base + '/subscription' } },
      { text: 'Profil', web_app: { url: base + '/profile' } },
    ]);

    rows.push([{ text: 'Yordam', callback_data: 'help' }]);

    return { inline_keyboard: rows };
  }

  /** Chat pastidagi doimiy Menu tugmasi */
  async setMenuButton(): Promise<void> {
    await this.call('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: 'MANYAK TV',
        web_app: { url: this.webAppUrl },
      },
    });
  }

  /** Webhook dan kelgan update ni qayta ishlash */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    if (update.callback_query) {
      const { id, data, from } = update.callback_query;
      const chatId = from?.id;

      await this.call('answerCallbackQuery', { callback_query_id: id });

      if (!chatId) return;

      if (data === 'help') {
        await this.sendMessage(
          chatId,
          '<b>Yordam</b>\n\n/start - asosiy menyu\n/help - yordam\n\nIlovani ochib kinolarni tomosha qiling. Obuna uchun "Tariflar" bolimiga oting.\n\nSavollar boyicha administratorga yozing.',
          this.mainKeyboard(),
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
      await this.setMenuButton();
      await this.sendMessage(
        chatId,
        'Salom, <b>' +
          name +
          '</b>!\n\n<b>MANYAK TV</b> ga xush kelibsiz.\n\nKinolar, seriallar, anime va mini dramalar - hammasi bir joyda.\n\nBoshlash uchun pastdagi tugmani bosing.',
        this.mainKeyboard(),
      );
      return;
    }

    if (text.startsWith('/help')) {
      await this.sendMessage(
        chatId,
        '<b>Yordam</b>\n\n/start - asosiy menyu\n/help - yordam\n\nKino qidirish uchun ilovani ochib, qidiruv bolimidan foydalaning.',
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
