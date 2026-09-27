import { Injectable, Logger } from '@nestjs/common';
import { BotService } from './bot.service';

/**
 * NotificationService - Bot orqali Telegram xabarlari yuborish
 *
 * Redis listener bu serviceni chaqiradi:
 *   payment.approved => VIP qabul qilindi xabari
 *   payment.rejected => Rad etildi xabari
 *   content.added    => Yangi kino qo'shildi xabari (broadcast)
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly botService: BotService) {}

  async notifyPaymentApproved(telegramId: string, data: {
    planName?: string;
    durationDays: number;
  }) {
    const text =
      'Tabriklaymiz! Sizning to\'lovingiz tasdiqlandi!\n\n' +
      `Plan: ${data.planName ?? 'VIP'}\n` +
      `Muddat: ${data.durationDays} kun\n\n` +
      'Manyak TV dan rohatlaning!';

    await this.botService.sendMessage(telegramId, text, {
      reply_markup: {
        inline_keyboard: [[
          { text: 'Filmlarni ko\'rish', web_app: { url: process.env.FRONTEND_URL } },
        ]],
      },
    });
  }

  async notifyPaymentRejected(telegramId: string, reason: string) {
    const text =
      'Kechirasiz, to\'lovingiz rad etildi.\n\n' +
      `Sabab: ${reason}\n\n` +
      'Savollar bo\'lsa admin bilan bog\'laning.';
    await this.botService.sendMessage(telegramId, text);
  }

  async notifyNewContent(chatIds: string[], title: string, posterUrl?: string) {
    const text = `Yangi kino qo\'shildi!\n\n${title}\n\nManyak TV da ko\'ring!`;
    for (const chatId of chatIds) {
      await this.botService.sendMessage(chatId, text);
    }
  }
}
