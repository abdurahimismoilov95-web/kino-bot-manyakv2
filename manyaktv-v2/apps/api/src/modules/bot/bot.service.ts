import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerifyService } from '../verify/verify.service';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

/** Render static site manzili. WEBAPP_URL env bolmasa shu ishlatiladi. */
const DEFAULT_WEBAPP_URL = 'https://manyaktv-web1.onrender.com';

/** Xotirada saqlanadigan kutilayotgan tasdiqlashlar soni chegarasi (xotira to'lib ketmasligi uchun) */
const MAX_PENDING = 5000;

/** Foydalanuvchi ismini HTML xabarga xavfsiz qo'yish */
function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 64);
}

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    from?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    text?: string;
    contact?: {
      user_id?: number;
      phone_number?: string;
      first_name?: string;
      last_name?: string;
    };
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

  /** chatId -> tasdiqlash kodi (deep link orqali kelgan) */
  private readonly pendingVerify = new Map<number, string>();

  constructor(
    private readonly config: ConfigService,
    private readonly verifyService: VerifyService,
  ) {}

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

  /** Telegram Bot API ga sorov yuborish (token logga hech qachon yozilmaydi) */
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
        this.logger.warn(method + ' xato: ' + res.status + ' ' + body.slice(0, 300));
      }
    } catch (err) {
      this.logger.error(method + ' yuborilmadi: ' + String((err as Error)?.message || err));
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

  /** Asosiy menyu tugmalari: Ochish, Tariflar, Profil */
  private mainKeyboard() {
    const base = this.webAppUrl;
    const rows: Array<Array<Record<string, unknown>>> = [];

    rows.push([{ text: 'MANYAK TV ni ochish', web_app: { url: base } }]);

    rows.push([
      { text: 'Tariflar', web_app: { url: base + '/subscription' } },
      { text: 'Profil', web_app: { url: base + '/profile' } },
    ]);

    return { inline_keyboard: rows };
  }

  /** Kontakt sorash klaviaturasi */
  private contactKeyboard() {
    return {
      keyboard: [
        [{ text: 'Kontaktni yuborish', request_contact: true }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    };
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

  private rememberPending(chatId: number, code: string): void {
    if (this.pendingVerify.size >= MAX_PENDING && !this.pendingVerify.has(chatId)) {
      const oldest = this.pendingVerify.keys().next().value;
      if (oldest !== undefined) this.pendingVerify.delete(oldest);
    }
    this.pendingVerify.delete(chatId);
    this.pendingVerify.set(chatId, code);
  }

  /** Webhook dan kelgan update ni qayta ishlash */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    if (update.callback_query) {
      const { id, data, from } = update.callback_query;
      const chatId = from?.id;

      await this.call('answerCallbackQuery', { callback_query_id: id });

      if (!chatId) return;

      // Eski xabarlardagi "Yordam" tugmasi bosilsa ham javob beriladi
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

    // 1) Kontakt keldi -> tasdiqlashni yakunlash
    if (message?.contact) {
      await this.handleContact(chatId, message);
      return;
    }

    const text = (message?.text || '').trim();
    const name = escapeHtml(message?.from?.first_name || 'dost');

    if (text.startsWith('/start')) {
      const payload = text.slice('/start'.length).trim();

      // 2) Saytdan kelgan tasdiqlash havolasi: /start v_KOD (yoki auth_KOD)
      const match = /^(?:v_|auth_|verify_)([A-Za-z0-9_-]{4,64})$/.exec(payload);
      if (match) {
        const code = match[1];
        this.rememberPending(chatId, code);

        await this.sendMessage(
          chatId,
          'Salom, <b>' +
            name +
            '</b>!\n\nHisobingizni tasdiqlash uchun pastdagi <b>"Kontaktni yuborish"</b> tugmasini bosing.\n\nBu faqat sizning Telegram hisobingiz ekanini tekshirish uchun kerak. Raqamingiz hech kimga korsatilmaydi.',
          this.contactKeyboard(),
        );
        return;
      }

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

  /** Kontakt xabarini qayta ishlash */
  private async handleContact(
    chatId: number,
    message: NonNullable<TelegramUpdate['message']>,
  ): Promise<void> {
    const code = this.pendingVerify.get(chatId);

    if (!code) {
      await this.sendMessage(
        chatId,
        'Tasdiqlash sorovi topilmadi.\n\nIltimos, saytdagi <b>"Botga otish va tasdiqlash"</b> tugmasini qaytadan bosing.',
        { remove_keyboard: true },
      );
      return;
    }

    const result = await this.verifyService.completeByContact(
      code,
      message.from || {},
      message.contact || {},
    );

    if (result.ok) {
      this.pendingVerify.delete(chatId);
      await this.sendMessage(
        chatId,
        '<b>Tasdiqlandi!</b>\n\nEndi saytga qayting - hisobingiz avtomatik ochiladi.',
        { remove_keyboard: true },
      );
      await this.setMenuButton();
      await this.sendMessage(
        chatId,
        'MANYAK TV ni ochish uchun pastdagi tugmani bosing.',
        this.mainKeyboard(),
      );
      return;
    }

    let reason = 'Tasdiqlab bolmadi. Qaytadan urinib koring.';
    if (result.reason === 'expired') {
      this.pendingVerify.delete(chatId);
      reason =
        'Tasdiqlash kodi eskirgan. Saytga qaytib, tasdiqlashni qaytadan boshlang.';
    } else if (result.reason === 'foreign_contact') {
      reason =
        'Iltimos, <b>ozingizning</b> kontaktingizni yuboring. Boshqa odamning kontakti qabul qilinmaydi.';
    } else if (result.reason === 'banned') {
      this.pendingVerify.delete(chatId);
      reason = 'Hisobingiz bloklangan. Administrator bilan boglaning.';
    }

    await this.sendMessage(chatId, reason, { remove_keyboard: true });
  }
}
