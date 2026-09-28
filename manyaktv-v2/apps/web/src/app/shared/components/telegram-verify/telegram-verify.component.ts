import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { StorageService } from '../../../core/services/storage.service';

type Phase = 'idle' | 'starting' | 'waiting' | 'in_bot' | 'verified' | 'error';

/**
 * manyak-tv1 TelegramVerificationModal.tsx + TelegramAuthModal.tsx ko'chirmasi.
 *
 * Oqim (serverda tekshiriladi, soxta tasdiqlash yo'q):
 *   1. sayt  -> POST /verify/start        -> { code, deepLink }
 *   2. foydalanuvchi botni ochadi (deep link) -> bot kontakt so'raydi
 *   3. foydalanuvchi KONTAKTINI yuboradi
 *   4. server contact.user_id === from.id ni tekshiradi
 *   5. sayt  -> GET /verify/status?code=  -> { verified, token, user }
 *
 * Telegram Mini App ichida bo'lsa tg.requestContact() ishlatiladi.
 */
@Component({
  selector: 'app-telegram-verify',
  template: `
    <div class="tv-ovl" *ngIf="open">
      <div class="tv-card">
        <button class="tv-x" *ngIf="dismissible" (click)="close()">&#10005;</button>

        <div class="tv-head">
          <div class="tv-ico">&#9993;</div>
          <h3>Telegram Profil Orqali Tasdiqlash</h3>
          <p>
            Sayt va rasmiy <b>&#64;{{ botUsername }}</b> boti integratsiyasi.
            Profilingizni bot orqali tasdiqlang.
          </p>
        </div>

        <div class="tv-alert tv-err" *ngIf="phase === 'error'">
          <span class="tv-alert-i">&#9888;</span>
          <span>{{ error }}</span>
        </div>

        <div class="tv-alert tv-ok" *ngIf="phase === 'verified'">
          <span class="tv-alert-i">&#10003;</span>
          <span>Hisobingiz tasdiqlandi! Ilova yuklanmoqda...</span>
        </div>

        <div class="tv-alert tv-info" *ngIf="phase === 'in_bot'">
          <span class="tv-alert-i">&#9200;</span>
          <span>Bot ochildi. Botdagi "Kontaktni yuborish" tugmasini bosing &#8212; tasdiqlanishi avtomatik aniqlanadi.</span>
        </div>

        <div class="tv-box">
          <div class="tv-box-top">
            <span class="tv-box-t">Telegram Bot Orqali Tasdiqlash</span>
            <span class="tv-box-u">&#64;{{ botUsername }}</span>
          </div>

          <p class="tv-box-p">
            Rasmiy botimizga oting va <b>"Kontaktni yuborish"</b> tugmasi orqali hisobingizni tasdiqlang.
          </p>

          <div class="tv-code" *ngIf="code">
            <span class="tv-code-l">Tasdiqlash kodi</span>
            <span class="tv-code-v">{{ code }}</span>
          </div>

          <button class="tv-btn" [disabled]="phase === 'starting'" (click)="start()">
            <ng-container *ngIf="phase === 'starting'">Kod olinmoqda...</ng-container>
            <ng-container *ngIf="phase !== 'starting'">Botga otish va tasdiqlash</ng-container>
          </button>

          <button class="tv-again" *ngIf="phase === 'waiting' || phase === 'in_bot'" (click)="openLink()">
            &#8635; Botni qayta ochish
          </button>

          <div class="tv-wait" *ngIf="phase === 'waiting' || phase === 'in_bot'">
            Kontakt yuborilishi kutilmoqda...
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tv-ovl {
      position: fixed; inset: 0; z-index: 70; display: flex;
      align-items: center; justify-content: center; padding: 14px;
      background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
      overflow-y: auto;
    }
    .tv-card {
      position: relative; width: 100%; max-width: 400px; margin: auto;
      padding: 22px 18px; border-radius: 24px;
      background: #121216; border: 1px solid #27272a;
      box-shadow: 0 24px 60px rgba(0,0,0,0.7);
    }
    .tv-x {
      position: absolute; top: 14px; right: 14px;
      width: 30px; height: 30px; border-radius: 10px; cursor: pointer;
      background: rgba(39,39,42,0.85); border: none; color: #a1a1aa; font-size: 12px;
    }
    .tv-head { text-align: center; margin-bottom: 18px; }
    .tv-ico {
      width: 54px; height: 54px; margin: 0 auto 12px; border-radius: 17px;
      background: rgba(23,37,84,0.7); border: 1px solid rgba(37,99,235,0.5);
      display: flex; align-items: center; justify-content: center;
      color: #60a5fa; font-size: 24px;
      box-shadow: 0 12px 28px rgba(30,58,138,0.3);
    }
    .tv-head h3 { margin: 0; font-size: 17px; font-weight: 900; color: #fff; letter-spacing: -0.01em; }
    .tv-head p { margin: 6px auto 0; font-size: 11.5px; color: #a1a1aa; line-height: 1.55; max-width: 310px; }
    .tv-alert {
      display: flex; align-items: flex-start; gap: 9px;
      padding: 12px; border-radius: 16px; margin-bottom: 14px;
      font-size: 11.5px; font-weight: 600; line-height: 1.5;
    }
    .tv-alert-i { flex-shrink: 0; font-size: 13px; }
    .tv-err { background: rgba(69,10,10,0.8); border: 1px solid rgba(239,68,68,0.8); color: #fca5a5; }
    .tv-ok { background: rgba(6,78,59,0.8); border: 1px solid rgba(16,185,129,0.8); color: #6ee7b7; }
    .tv-info { background: rgba(23,37,84,0.8); border: 1px solid rgba(59,130,246,0.8); color: #93c5fd; }
    .tv-box {
      padding: 15px; border-radius: 18px;
      background: rgba(24,24,27,0.9); border: 1px solid #27272a;
    }
    .tv-box-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .tv-box-t { font-size: 11.5px; font-weight: 800; color: #fff; }
    .tv-box-u {
      font-size: 10px; color: #60a5fa; font-family: monospace;
      background: rgba(23,37,84,0.8); border: 1px solid rgba(30,64,175,0.8);
      padding: 2px 8px; border-radius: 999px;
    }
    .tv-box-p { margin: 10px 0 0; font-size: 11.5px; color: #d4d4d8; line-height: 1.55; }
    .tv-code {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 12px; padding: 10px 12px; border-radius: 13px;
      background: rgba(9,9,11,0.9); border: 1px dashed #3f3f46;
    }
    .tv-code-l { font-size: 10px; color: #71717a; font-weight: 700; }
    .tv-code-v { font-size: 15px; font-weight: 900; color: #fbbf24; font-family: monospace; letter-spacing: 0.12em; }
    .tv-btn {
      width: 100%; margin-top: 13px; padding: 13px; border: none;
      border-radius: 14px; cursor: pointer;
      background: #2563eb; color: #fff; font-size: 12.5px; font-weight: 800;
      box-shadow: 0 10px 24px rgba(37,99,235,0.3);
    }
    .tv-btn:disabled { background: #27272a; color: #71717a; box-shadow: none; }
    .tv-again {
      width: 100%; margin-top: 8px; padding: 10px; cursor: pointer;
      border-radius: 13px; background: rgba(39,39,42,0.9);
      border: 1px solid rgba(63,63,70,0.8); color: #d4d4d8;
      font-size: 11.5px; font-weight: 700;
    }
    .tv-wait { margin-top: 10px; text-align: center; font-size: 10.5px; color: #71717a; }
  `],
})
export class TelegramVerifyComponent implements OnDestroy {
  @Input() open = false;
  @Input() dismissible = true;
  @Input() botUsername = 'Manyaktvbot';
  @Output() verified = new EventEmitter<any>();
  @Output() closed = new EventEmitter<void>();

  phase: Phase = 'idle';
  code = '';
  deepLink = '';
  error = '';

  private timer: any = null;

  constructor(
    private readonly http: HttpClient,
    private readonly storage: StorageService,
  ) {}

  ngOnDestroy(): void { this.stop(); }

  close(): void {
    this.stop();
    this.open = false;
    this.closed.emit();
  }

  private get base(): string { return environment.apiUrl; }

  start(): void {
    this.phase = 'starting';
    this.error = '';
    this.http.post<any>(this.base + '/verify/start', {}).subscribe({
      next: (r: any) => {
        if (!r || !r.code || !r.deepLink) {
          this.phase = 'error';
          this.error = 'Tasdiqlashni boshlab bolmadi. Keyinroq urinib koring.';
          return;
        }
        this.code = r.code;
        this.deepLink = r.deepLink;
        if (r.botUsername) { this.botUsername = String(r.botUsername).replace('@', ''); }
        this.phase = 'waiting';
        this.openLink();
        this.poll();
      },
      error: (e: any) => {
        this.phase = 'error';
        this.error = (e && e.error && e.error.message)
          ? e.error.message
          : 'Serverga ulanib bolmadi. Internet aloqasini tekshiring.';
      },
    });
  }

  /** Telegram ichida bo'lsa kontaktni to'g'ridan-to'g'ri so'raymiz. */
  openLink(): void {
    const tg = this.tg();
    if (tg && typeof tg.requestContact === 'function') {
      try {
        tg.requestContact(() => { this.phase = 'in_bot'; });
        return;
      } catch {
        /* qollab-quvvatlanmasa deep link bilan davom etamiz */
      }
    }
    const link = this.deepLink || ('https://t.me/' + this.botUsername);
    if (tg && typeof tg.openTelegramLink === 'function') {
      try {
        tg.openTelegramLink(link);
        this.phase = 'in_bot';
        return;
      } catch {
        /* fallback */
      }
    }
    window.open(link, '_blank');
    this.phase = 'in_bot';
  }

  private poll(): void {
    this.stop();
    this.timer = setInterval(() => {
      const url = this.base + '/verify/status?code=' + encodeURIComponent(this.code);
      this.http.get<any>(url).subscribe({
        next: (d: any) => {
          if (!d) { return; }
          if (d.status === 'expired') {
            this.stop();
            this.phase = 'error';
            this.error = 'Tasdiqlash kodi muddati tugadi. Iltimos, qaytadan boshlang.';
            return;
          }
          if (d.status === 'awaiting_contact') {
            this.phase = 'in_bot';
            return;
          }
          if (d.verified && d.token && d.user) {
            this.stop();
            this.storage.setToken(d.token);
            this.storage.setUser(d.user);
            this.phase = 'verified';
            setTimeout(() => { this.verified.emit(d.user); }, 900);
          }
        },
        error: () => { /* tarmoq uzilishi - keyingi urinishda davom etadi */ },
      });
    }, 2000);
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tg(): any {
    try {
      const w = window as any;
      return w.Telegram && w.Telegram.WebApp ? w.Telegram.WebApp : null;
    } catch {
      return null;
    }
  }
}
