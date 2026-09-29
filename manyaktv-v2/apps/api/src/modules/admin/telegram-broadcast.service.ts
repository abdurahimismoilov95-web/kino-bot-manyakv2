import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

export interface BroadcastOptions {
  text: string;
  photoUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  audience?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class TelegramBroadcastService {
  private readonly logger = new Logger(TelegramBroadcastService.name);

  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  private async tg(method: string, payload: Record<string, unknown>): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!token) return false;
    try {
      const res = await fetch('https://api.telegram.org/bot' + token + '/' + method, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        this.logger.warn(method + ' ' + res.status + ' ' + (await res.text()));
      }
      return res.ok;
    } catch (e) {
      this.logger.error(method + ' xato', e as Error);
      return false;
    }
  }

  /** Foydalanuvchilar sonini qaytaradi, yuborish fonda davom etadi. */
  async start(opts: BroadcastOptions): Promise<{ total: number }> {
    const qb = this.users
      .createQueryBuilder('u')
      .select(['u.id', 'u.telegramId', 'u.isVip'])
      .where('u.isBanned = false');
    if (opts.audience === 'vip') qb.andWhere('u.isVip = true');
    if (opts.audience === 'free') qb.andWhere('u.isVip = false');
    const list = await qb.getMany();
    const ids = list
      .map((u: any) => Number(u.telegramId || u.id))
      .filter((n) => Number.isFinite(n) && n > 0);

    void this.run(ids, opts);
    return { total: ids.length };
  }

  private async run(ids: number[], opts: BroadcastOptions): Promise<void> {
    let sent = 0;
    let failed = 0;
    let markup: unknown = undefined;
    if (opts.buttonText && opts.buttonUrl) {
      markup = {
        inline_keyboard: [[{ text: opts.buttonText, web_app: { url: opts.buttonUrl } }]],
      };
    }
    const text = opts.text || '';
    for (const chatId of ids) {
      let ok = false;
      if (opts.photoUrl && text.length <= 1000) {
        ok = await this.tg('sendPhoto', {
          chat_id: chatId,
          photo: opts.photoUrl,
          caption: text,
          parse_mode: 'HTML',
          reply_markup: markup,
        });
      }
      if (!ok) {
        ok = await this.tg('sendMessage', {
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: markup,
        });
      }
      if (ok) sent++;
      else failed++;
      await sleep(50);
    }
    this.logger.log('Broadcast tugadi: yuborildi ' + sent + ', xato ' + failed);
  }
}
