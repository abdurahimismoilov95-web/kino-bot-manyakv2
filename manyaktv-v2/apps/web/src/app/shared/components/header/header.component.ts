import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  template: `
    <header class="mt-header">
      <div class="mt-header-inner">
        <div class="flex items-center gap-2">
          <button *ngIf="canGoBack" class="mt-icon-btn" (click)="back()" title="Orqaga">&#8592;</button>

          <div class="mt-logo-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-linecap="round" stroke-linejoin="round" class="mt-ghost">
              <path d="M9 2a8 8 0 0 0-8 8v11.5l2.5-2.5 2.5 2.5 3-3 3 3 2.5-2.5 2.5 2.5V10c0-4.4-3.6-8-8-8z"
                    stroke="#ef4444" fill="rgba(239,68,68,0.10)" stroke-width="1.5" />
              <path d="M4.5 8.5l2.5 2.5m0-2.5l-2.5 2.5" stroke="#ef4444" stroke-width="1.5" />
              <circle cx="11.5" cy="9.5" r="1.5" stroke="#ef4444" fill="#ef4444" stroke-width="1.5" />
              <path d="M7 14.5c1.5 1.5 3.5 1.5 5 0" stroke="#ef4444" stroke-width="1.5" />
              <path d="M15 13h2" stroke="#ef4444" stroke-width="1.5" />
              <path d="M19.5 13v4" stroke="#92400e" stroke-width="2.5" />
              <path d="M18.5 13h2" stroke="#a1a1aa" stroke-width="1.5" />
              <path d="M19.5 13V4l3 3.5V13z" stroke="#e4e4e7" fill="rgba(228,228,231,0.2)" stroke-width="1.5" />
              <path d="M22.5 13v1.5a1 1 0 0 1-2 0" stroke="#dc2626" fill="#dc2626" stroke-width="1" />
            </svg>
          </div>

          <div class="mt-wordmark">
            <span class="mt-word-white">MANYAK</span><span class="mt-word-red">TV</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <a *ngIf="channelUrl" [href]="channelUrl" target="_blank" rel="noopener"
             class="mt-pill" title="Telegram kanal">Kanal</a>

          <button *ngIf="isAdmin" class="mt-pill mt-pill-admin" (click)="openAdmin()" title="Admin panel">
            Admin
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .mt-header {
      position: sticky; top: 0; z-index: 30; width: 100%;
      background: rgba(9, 9, 11, 0.95);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(39, 39, 42, 0.8);
      padding: 10px 14px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }
    .mt-header-inner {
      max-width: 1120px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
    }
    .mt-icon-btn {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(39, 39, 42, 0.9); color: #e4e4e7;
      border: 1px solid #3f3f46; font-size: 18px; line-height: 1;
    }
    .mt-logo-box {
      position: relative; display: flex; align-items: center; justify-content: center;
      width: 42px; height: 42px; border-radius: 12px;
      background: linear-gradient(135deg, #000 0%, #18181b 55%, #450a0a 100%);
      border: 2px solid rgba(127, 29, 29, 0.6);
      box-shadow: 0 0 15px rgba(220, 38, 38, 0.4);
      transform: skewX(-6deg);
      overflow: hidden;
    }
    .mt-ghost { width: 26px; height: 26px; margin-left: -2px; }
    .mt-wordmark { display: flex; align-items: center; gap: 3px; transform: skewX(-6deg); }
    .mt-word-white {
      font-weight: 900; letter-spacing: -0.04em; font-size: 22px; color: #fff;
      text-transform: uppercase; text-shadow: 0 2px 8px rgba(220, 38, 38, 0.5);
    }
    .mt-word-red {
      font-weight: 900; letter-spacing: -0.04em; font-size: 22px; color: #dc2626;
      text-transform: uppercase;
    }
    .mt-pill {
      display: inline-flex; align-items: center; height: 36px; padding: 0 13px;
      border-radius: 9px; font-size: 13px; font-weight: 700;
      background: rgba(39, 39, 42, 0.8); color: #d4d4d8;
      border: 1px solid rgba(63, 63, 70, 0.5); text-decoration: none;
    }
    .mt-pill-admin {
      background: rgba(69, 10, 10, 0.9); color: #fca5a5;
      border-color: rgba(185, 28, 28, 0.7);
    }
  `],
})
export class HeaderComponent implements OnInit {
  @Input() isAdmin = false;
  @Input() canGoBack = false;
  @Input() channelUrl: string | null = null;

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      try { tg.ready(); tg.expand(); } catch (e) { /* noop */ }
    }
  }

  back(): void { history.back(); }

  openAdmin(): void { this.router.navigate(['/admin']); }
}
