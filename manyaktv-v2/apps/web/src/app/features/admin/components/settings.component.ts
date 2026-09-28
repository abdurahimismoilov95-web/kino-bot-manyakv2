import { Component, OnInit } from '@angular/core';
import { AdminApiService } from './admin-api.service';

/** v1 AdminPanel -> "Bot & Havolalar" bolimi. */
@Component({
  selector: 'app-admin-settings',
  template: `
    <div class="ap">
      <h2>Bot &amp; Havolalar</h2>
      <p class="hint">Bot username, kanal, admin murojaat va tolov kartasi malumotlari.</p>

      <p class="ap-err" *ngIf="error">{{ error }}</p>
      <p class="ap-muted" *ngIf="loading">Yuklanmoqda...</p>

      <div class="form">
        <label class="lb">Bot username</label>
        <input class="in" [(ngModel)]="s.botUsername" [ngModelOptions]="{ standalone: true }" placeholder="Manyaktvbot" />

        <label class="lb">Kanal havolasi</label>
        <input class="in" [(ngModel)]="s.channelUrl" [ngModelOptions]="{ standalone: true }" placeholder="https://t.me/..." />

        <label class="lb">Adminga murojaat havolasi</label>
        <input class="in" [(ngModel)]="s.adminContactUrl" [ngModelOptions]="{ standalone: true }" placeholder="https://t.me/..." />

        <label class="lb">WebApp havolasi</label>
        <input class="in" [(ngModel)]="s.webAppUrl" [ngModelOptions]="{ standalone: true }" placeholder="https://manyaktv-web1.onrender.com" />

        <label class="lb">Tolov kartasi raqami</label>
        <input class="in" [(ngModel)]="s.cardNumber" [ngModelOptions]="{ standalone: true }" placeholder="8600 0000 0000 0000" />

        <label class="lb">Karta egasi</label>
        <input class="in" [(ngModel)]="s.cardHolder" [ngModelOptions]="{ standalone: true }" placeholder="F.I.SH" />

        <button class="b b-red wide" [disabled]="saving" (click)="save()">
          {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
        </button>
      </div>

      <p class="ap-ok" *ngIf="okMsg">{{ okMsg }}</p>
    </div>
  `,
  styles: [`
    .ap { padding: 16px; color: #fff; }
    h2 { font-size: 1rem; font-weight: 800; margin: 0; }
    .hint { font-size: 0.72rem; color: #a1a1aa; margin: 6px 0 14px; }
    .form { background: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 14px; }
    .lb { display: block; font-size: 0.72rem; color: #a1a1aa; font-weight: 700; margin: 10px 0 5px; }
    .in { width: 100%; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 10px; padding: 10px 12px; color: #fff; font-size: 0.85rem; outline: none; }
    .b { border: none; border-radius: 12px; padding: 13px; font-size: 0.85rem; font-weight: 800; cursor: pointer; }
    .b-red { background: linear-gradient(135deg, #dc2626, #b91c1c); color: #fff; }
    .wide { width: 100%; margin-top: 16px; }
    .b:disabled { opacity: 0.45; }
    .ap-ok { font-size: 0.8rem; color: #34d399; margin-top: 12px; }
    .ap-err { font-size: 0.8rem; color: #fca5a5; }
    .ap-muted { font-size: 0.78rem; color: #71717a; }
  `],
})
export class AdminSettingsComponent implements OnInit {
  s: any = {
    botUsername: 'Manyaktvbot',
    channelUrl: '',
    adminContactUrl: '',
    webAppUrl: '',
    cardNumber: '',
    cardHolder: '',
  };
  loading = false;
  saving = false;
  error = '';
  okMsg = '';

  constructor(private readonly api: AdminApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.getSettings().subscribe({
      next: (r: any) => {
        this.loading = false;
        if (r) { this.s = Object.assign({}, this.s, r); }
      },
      error: () => { this.loading = false; this.error = 'Sozlamalarni yuklab bolmadi.'; },
    });
  }

  save(): void {
    this.saving = true;
    this.okMsg = '';
    this.error = '';
    this.api.saveSettings(this.s).subscribe({
      next: () => { this.saving = false; this.okMsg = 'Saqlandi.'; },
      error: () => { this.saving = false; this.error = 'Saqlanmadi.'; },
    });
  }
}
