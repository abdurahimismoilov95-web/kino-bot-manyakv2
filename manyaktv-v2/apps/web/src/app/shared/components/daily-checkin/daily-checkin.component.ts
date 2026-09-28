import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { StorageService } from '../../../core/services/storage.service';

interface DayReward {
  day: number;
  type: 'tokens' | 'bonus' | 'vip_discount' | 'vip';
  label: string;
  amount: string;
}

/**
 * manyak-tv1 DailyCheckInWidget.tsx ko'chirilgan varianti.
 * Alohida stil: o'ngda suzib turgan sovga tugmasi (FAB) + 7 kunlik modal.
 */
@Component({
  selector: 'app-daily-checkin',
  template: `
    <button class="dc-fab" *ngIf="!open" (click)="open = true">
      <span class="dc-fab-ico">&#127873;</span>
      <span class="dc-dot" *ngIf="!claimedToday"></span>
    </button>

    <div class="dc-ovl" *ngIf="open" (click)="open = false">
      <div class="dc-card" (click)="stop($event)">
        <button class="dc-x" (click)="open = false">&#10005;</button>
        <div class="dc-glow"></div>

        <div class="dc-top">
          <div class="dc-badge">&#127873;</div>
          <div class="dc-top-txt">
            <div class="dc-title-row">
              <h3>Kunlik Kirish Bonusi</h3>
              <span class="dc-streak" *ngIf="streak > 0">&#128293; {{ streak }} kun</span>
            </div>
            <p>Har kuni kirib bepul korish tokeni va bonuslarni oling!</p>
          </div>
        </div>

        <div class="dc-bal">
          <span class="dc-pill">&#127903; {{ tokens }} <small>token</small></span>
          <span class="dc-pill dc-pill-green" *ngIf="bonus > 0">&#128176; {{ bonus }} <small>som</small></span>
        </div>

        <div class="dc-grid">
          <div class="dc-day"
               *ngFor="let r of rewards"
               [class.dc-done]="isClaimed(r)"
               [class.dc-today]="isToday(r)"
               [class.dc-vip]="r.day === 7">
            <div class="dc-day-n">{{ r.day }}-kun</div>
            <div class="dc-day-ico">{{ iconOf(r) }}</div>
            <div class="dc-day-amt">{{ r.amount }}</div>
            <div class="dc-check" *ngIf="isClaimed(r)">&#10003;</div>
          </div>
        </div>

        <div class="dc-msg" *ngIf="message">{{ message }}</div>

        <button class="dc-claim" [disabled]="claimedToday || busy" (click)="claim()">
          <ng-container *ngIf="claimedToday">&#10003; Bugun olindi</ng-container>
          <ng-container *ngIf="!claimedToday && !busy">&#127873; Bugungi bonusni olish</ng-container>
          <ng-container *ngIf="!claimedToday && busy">Yuklanmoqda...</ng-container>
        </button>

        <button class="dc-vip-link" *ngIf="!isVip" (click)="openVip.emit()">
          &#128081; VIP obunani korish &#8250;
        </button>

        <p class="dc-info">
          Ketma-ket 7 kun kirsangiz VIP chegirma va qoshimcha tokenlar ochiladi.
          Bir kun otkazib yuborsangiz hisob boshidan boshlanadi.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .dc-fab {
      position: fixed; right: 14px; bottom: 96px; z-index: 40;
      width: 48px; height: 48px; border-radius: 50%; cursor: pointer;
      background: linear-gradient(135deg, #dc2626, #d97706);
      border: 2px solid #18181b;
      box-shadow: 0 10px 26px rgba(220,38,38,0.45);
      display: flex; align-items: center; justify-content: center;
    }
    .dc-fab-ico { font-size: 20px; animation: dcb 2s infinite; }
    @keyframes dcb { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
    .dc-dot {
      position: absolute; top: 0; right: 0; width: 12px; height: 12px;
      border-radius: 50%; background: #ef4444; border: 2px solid #18181b;
      animation: dcp 1.4s infinite;
    }
    @keyframes dcp { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
    .dc-ovl {
      position: fixed; inset: 0; z-index: 60; display: flex;
      align-items: center; justify-content: center; padding: 16px;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
    }
    .dc-card {
      position: relative; width: 100%; max-width: 380px;
      max-height: 88vh; overflow-y: auto; padding: 18px;
      border-radius: 22px; border: 1px solid #27272a;
      background: linear-gradient(180deg, #18181b, #121217);
      box-shadow: 0 24px 60px rgba(0,0,0,0.7);
    }
    .dc-card::-webkit-scrollbar { display: none; }
    .dc-glow {
      position: absolute; top: -60px; right: -60px; width: 150px; height: 150px;
      background: radial-gradient(circle, rgba(220,38,38,0.22), transparent 70%);
      pointer-events: none;
    }
    .dc-x {
      position: absolute; top: 10px; right: 10px; z-index: 2;
      width: 30px; height: 30px; border-radius: 50%; cursor: pointer;
      background: rgba(0,0,0,0.45); border: none; color: #d4d4d8; font-size: 13px;
    }
    .dc-top { display: flex; align-items: flex-start; gap: 11px; position: relative; }
    .dc-badge {
      width: 38px; height: 38px; flex-shrink: 0; border-radius: 13px;
      background: linear-gradient(135deg, #dc2626, #d97706);
      display: flex; align-items: center; justify-content: center; font-size: 18px;
      box-shadow: 0 8px 18px rgba(220,38,38,0.3);
    }
    .dc-top-txt { min-width: 0; }
    .dc-title-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
    .dc-title-row h3 { margin: 0; font-size: 14.5px; font-weight: 900; color: #fff; }
    .dc-streak {
      font-size: 10.5px; font-weight: 900; color: #fbbf24;
      background: rgba(69,26,3,0.8); border: 1px solid rgba(146,64,14,0.85);
      padding: 2px 8px; border-radius: 999px;
    }
    .dc-top-txt p { margin: 4px 0 0; font-size: 11px; color: #a1a1aa; line-height: 1.45; }
    .dc-bal { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
    .dc-pill {
      display: inline-flex; align-items: center; gap: 5px;
      background: rgba(9,9,11,0.85); border: 1px solid #27272a;
      padding: 5px 10px; border-radius: 12px;
      font-size: 12px; font-weight: 800; color: #e4e4e7;
    }
    .dc-pill small { font-size: 9.5px; font-weight: 500; color: #71717a; }
    .dc-pill-green { color: #34d399; }
    .dc-grid {
      display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 7px; margin-top: 16px;
    }
    .dc-day {
      position: relative; padding: 8px 4px; border-radius: 13px; text-align: center;
      background: rgba(9,9,11,0.8); border: 1px solid #27272a;
    }
    .dc-day-n { font-size: 9px; font-weight: 800; color: #71717a; }
    .dc-day-ico { font-size: 17px; margin: 3px 0; }
    .dc-day-amt { font-size: 9.5px; font-weight: 800; color: #d4d4d8; }
    .dc-done { border-color: rgba(16,185,129,0.55); background: rgba(6,78,59,0.3); }
    .dc-done .dc-day-amt { color: #34d399; }
    .dc-today {
      border-color: #dc2626; background: rgba(69,10,10,0.55);
      box-shadow: 0 0 0 2px rgba(220,38,38,0.22);
    }
    .dc-vip { border-color: rgba(217,119,6,0.7); background: rgba(69,26,3,0.45); }
    .dc-check {
      position: absolute; top: 3px; right: 4px;
      font-size: 10px; color: #34d399; font-weight: 900;
    }
    .dc-msg {
      margin-top: 13px; padding: 9px 11px; border-radius: 12px;
      background: rgba(6,78,59,0.35); border: 1px solid rgba(16,185,129,0.45);
      font-size: 11.5px; color: #6ee7b7; text-align: center; font-weight: 700;
    }
    .dc-claim {
      width: 100%; margin-top: 15px; padding: 13px; border: none;
      border-radius: 15px; cursor: pointer;
      background: linear-gradient(90deg, #dc2626, #b91c1c);
      color: #fff; font-size: 13.5px; font-weight: 900;
      box-shadow: 0 10px 24px rgba(220,38,38,0.32);
    }
    .dc-claim:disabled {
      background: #27272a; color: #71717a; box-shadow: none; cursor: default;
    }
    .dc-vip-link {
      width: 100%; margin-top: 9px; padding: 11px; cursor: pointer;
      border-radius: 14px; background: rgba(69,26,3,0.45);
      border: 1px solid rgba(217,119,6,0.6);
      color: #fbbf24; font-size: 12.5px; font-weight: 800;
    }
    .dc-info { margin: 12px 0 0; font-size: 10.5px; color: #71717a; line-height: 1.55; text-align: center; }
  `],
})
export class DailyCheckinComponent implements OnInit {
  @Input() isVip = false;
  @Output() openVip = new EventEmitter<void>();

  open = false;
  busy = false;
  message = '';
  tokens = 0;
  bonus = 0;
  streak = 0;
  claimedToday = false;

  rewards: DayReward[] = [
    { day: 1, type: 'tokens', label: 'Token', amount: '1 token' },
    { day: 2, type: 'bonus', label: 'Bonus', amount: '1 000' },
    { day: 3, type: 'tokens', label: 'Token', amount: '2 token' },
    { day: 4, type: 'bonus', label: 'Bonus', amount: '2 000' },
    { day: 5, type: 'tokens', label: 'Token', amount: '3 token' },
    { day: 6, type: 'vip_discount', label: 'Chegirma', amount: '10%' },
    { day: 7, type: 'vip', label: 'VIP', amount: '1 kun VIP' },
  ];

  constructor(
    private readonly api: ApiService,
    private readonly storage: StorageService,
  ) {}

  ngOnInit(): void {
    const u = this.storage.getUser();
    if (u) {
      this.tokens = Number(u.accessTokens || 0);
      this.bonus = Number(u.bonusBalance || 0);
      this.streak = Number(u.checkinStreak || 0);
    }
    const today = new Date().toISOString().slice(0, 10);
    this.claimedToday = this.storage.get('checkin_day') === today;
  }

  get nextDay(): number {
    const s = this.streak % 7;
    return s + 1;
  }

  isClaimed(r: DayReward): boolean {
    return this.claimedToday ? r.day <= this.nextDay : r.day < this.nextDay;
  }

  isToday(r: DayReward): boolean {
    return !this.claimedToday && r.day === this.nextDay;
  }

  iconOf(r: DayReward): string {
    if (r.type === 'tokens') { return '\u{1F39F}'; }
    if (r.type === 'bonus') { return '\u{1F4B0}'; }
    if (r.type === 'vip_discount') { return '\u0025'; }
    return '\u{1F451}';
  }

  stop(event: Event): void { event.stopPropagation(); }

  claim(): void {
    if (this.claimedToday || this.busy) { return; }
    this.busy = true;
    this.api.checkin().subscribe({
      next: (r: any) => {
        this.busy = false;
        this.claimedToday = true;
        this.storage.set('checkin_day', new Date().toISOString().slice(0, 10));
        if (r && typeof r.streak === 'number') { this.streak = r.streak; }
        if (r && typeof r.accessTokens === 'number') { this.tokens = r.accessTokens; }
        if (r && typeof r.bonusBalance === 'number') { this.bonus = r.bonusBalance; }
        this.message = (r && r.message) ? r.message : 'Bonus muvaffaqiyatli olindi!';
        this.haptic();
      },
      error: (e: any) => {
        this.busy = false;
        const msg = e && e.error && e.error.message ? e.error.message : 'Bugungi bonus allaqachon olingan.';
        this.message = msg;
        this.claimedToday = true;
      },
    });
  }

  private haptic(): void {
    try {
      const tg = (window as any).Telegram;
      if (tg && tg.WebApp && tg.WebApp.HapticFeedback) {
        tg.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch {
      /* qollab-quvvatlanmasa etibor bermaymiz */
    }
  }
}
