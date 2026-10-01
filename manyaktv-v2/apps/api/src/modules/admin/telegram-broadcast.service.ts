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

interface TgResult {
  ok: boolean;
  result?: unknown;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class TelegramBroadcastService {
  private readonly logger = new Logger(TelegramBroadcastService.name);

  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  private async tg(method: string, payload: Record<string, unknown>): Promise<TgResult> {
    const token = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!token) return { ok: false };
    try {
      const res = await fetch('https://api.telegram.org/bot' + token + '/' + method, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let body: { ok?: boolean; result?: unknown } | null = null;
      try {
        body = JSON.parse(text) as { ok?: boolean; result?: unknown };
      } catch {
        body = null;
      }
      if (!res.ok || !body || body.ok !== true) {
        this.logger.warn(method + ' ' + res.status + ' ' + text.slice(0, 300));
        return { ok: false };
      }
      return { ok: true, result: body.result };
    } catch (e) {
      this.logger.error(method + ' xato', e as Error);
      return { ok: false };
    }
  }

  /**
   * Rasm havolasi haqiqatan ochiladimi (server qayta ishga tushganda fayl
   * o'chib ketgan bo'lishi mumkin). Ochilmasa xabar rasmsiz yuboriladi.
   */
  private async photoReachable(url: string): Promise<boolean> {
    if (!/^https:\/\//i.test(url)) return false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal });
      const type = (res.headers.get('content-type') || '').toLowerCase();
      return res.ok && type.startsWith('image/');
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Telegram'ga bir marta yuklangan rasmning file_id si (keyingilarga qayta ishlatiladi). */
  private fileIdOf(result: unknown): string | null {
    const photos = (result as { photo?: Array<{ file_id?: string }> } | undefined)?.photo;
    if (Array.isArray(photos) && photos.length > 0) {
      return photos[photos.length - 1].file_id || null;
    }
    return null;
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

    let photo: string | null = null;
    if (opts.photoUrl && text.length <= 1000) {
      if (await this.photoReachable(opts.photoUrl)) {
        photo = opts.photoUrl;
      } else {
        this.logger.warn('Broadcast rasmi ochilmadi, xabar rasmsiz yuboriladi: ' + opts.photoUrl);
      }
    }

    for (const chatId of ids) {
      let ok = false;
      if (photo) {
        const r = await this.tg('sendPhoto', {
          chat_id: chatId,
          photo,
          caption: text,
          parse_mode: 'HTML',
          reply_markup: markup,
        });
        ok = r.ok;
        if (r.ok && photo === opts.photoUrl) {
          const fid = this.fileIdOf(r.result);
          if (fid) photo = fid;
        }
      }
      if (!ok) {
        const r = await this.tg('sendMessage', {
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: markup,
        });
        ok = r.ok;
      }
      if (ok) sent++;
      else failed++;
      await sleep(50);
    }
    this.logger.log('Broadcast tugadi: yuborildi ' + sent + ', xato ' + failed);
  }
}
