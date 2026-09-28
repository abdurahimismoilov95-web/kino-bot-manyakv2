import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-daily-checkin',
  template: `
    <div class="dc">
      <div class="dc-left">
        <div class="dc-icon">&#9733;</div>
        <div>
          <p class="dc-title">Kunlik bonus</p>
          <p class="dc-sub">{{ subtitle }}</p>
        </div>
      </div>
      <button class="dc-btn" [disabled]="busy || claimed" (click)="claim()">
        {{ buttonLabel }}
      </button>
    </div>

    <div class="dc-vip" *ngIf="!isVip" (click)="openVip.emit()">
      <div class="dc-vip-left">
        <div class="dc-vip-icon">&#9889;</div>
        <div>
          <p class="dc-vip-title">VIP obuna</p>
          <p class="dc-vip-sub">Barcha premium kinolar cheksiz</p>
        </div>
      </div>
      <span class="dc-vip-arrow">&#8594;</span>
    </div>
  `,
  styles: [`
    .dc {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px 14px; border-radius: 16px;
      background: linear-gradient(135deg, #1c1917 0%, #18181b 60%, #18181b 100%);
      border: 1px solid rgba(63,63,70,0.7);
    }
    .dc-left { display: flex; align-items: center; gap: 10px; }
    .dc-icon {
      width: 38px; height: 38px; border-radius: 12px;
      background: rgba(245,158,11,0.15); color: #fbbf24;
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .dc-title { margin: 0; font-size: 13px; font-weight: 800; color: #fff; }
    .dc-sub { margin: 2px 0 0; font-size: 11px; color: #a1a1aa; }
    .dc-btn {
      padding: 7px 14px; border-radius: 9px; border: none;
      background: #dc2626; color: #fff; font-size: 12px; font-weight: 800;
      white-space: nowrap;
    }
    .dc-btn:disabled { background: #3f3f46; color: #a1a1aa; }
    .dc-vip {
      margin-top: 10px; display: flex; align-items: center; justify-content: space-between;
      padding: 14px; border-radius: 16px; cursor: pointer;
      background: linear-gradient(to right, rgba(69,10,10,0.8), #18181b 60%, #18181b);
      border: 1px solid rgba(153,27,27,0.6);
      box-shadow: 0 8px 20px rgba(0,0,0,0.4);
    }
    .dc-vip-left { display: flex; align-items: center; gap: 12px; }
    .dc-vip-icon {
      width: 40px; height: 40px; border-radius: 12px; background: #dc2626; color: #fde68a;
      display: flex; align-items: center; justify-content: center; font-size: 18px;
      box-shadow: 0 6px 16px rgba(220,38,38,0.3);
    }
    .dc-vip-title { margin: 0; font-size: 14px; font-weight: 900; color: #fff; }
    .dc-vip-sub { margin: 2px 0 0; font-size: 11px; color: #a1a1aa; }
    .dc-vip-arrow { color: #f87171; font-size: 18px; font-weight: 700; }
  `],
})
export class DailyCheckinComponent implements OnInit {
  @Input() isVip = false;
  @Output() openVip = new EventEmitter<void>();

  busy = false;
  claimed = false;
  streak = 0;
  tokens = 0;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.getMe().subscribe({
      next: (r: any) => {
        const u = r && r.user ? r.user : r;
        if (!u) { return; }
        this.streak = u.checkinStreak || 0;
        this.tokens = u.tokens || 0;
        this.isVip = !!u.isVip;
        this.claimed = this.isToday(u.lastCheckinAt);
      },
      error: () => { /* noop */ },
    });
  }

  get subtitle(): string {
    if (this.claimed) {
      return 'Bugun olingan. Ketma-ketlik: ' + this.streak + ' kun';
    }
    return 'Tokenlar: ' + this.tokens + ' / Ketma-ketlik: ' + this.streak;
  }

  get buttonLabel(): string {
    if (this.busy) { return '...'; }
    return this.claimed ? 'Olingan' : 'Olish';
  }

  claim(): void {
    if (this.busy || this.claimed) { return; }
    this.busy = true;
    this.api.checkin().subscribe({
      next: (r: any) => {
        this.busy = false;
        this.claimed = true;
        if (r && typeof r.tokens === 'number') { this.tokens = r.tokens; }
        if (r && typeof r.streak === 'number') { this.streak = r.streak; }
      },
      error: () => { this.busy = false; },
    });
  }

  private isToday(value: any): boolean {
    if (!value) { return false; }
    const d = new Date(value);
    const n = new Date();
    return d.getFullYear() === n.getFullYear()
      && d.getMonth() === n.getMonth()
      && d.getDate() === n.getDate();
  }
}
