import { Component } from '@angular/core';
import { AdminApiService } from './admin-api.service';

/** v1 AdminPanel -> "Xabar Yuborish" bolimi. */
@Component({
  selector: 'app-admin-broadcast',
  template: `
    <div class="ap">
      <h2>&#128226; Xabar Yuborish</h2>
      <p class="hint">Barcha foydalanuvchilarga bot orqali xabar yuboriladi.</p>

      <div class="form">
        <label class="lb">Xabar matni</label>
        <textarea
          class="ta"
          rows="6"
          [(ngModel)]="text"
          [ngModelOptions]="{ standalone: true }"
          placeholder="Salom! MANYAK TV da yangi kinolar..."></textarea>

        <label class="lb">Rasm havolasi (ixtiyoriy)</label>
        <input class="in" [(ngModel)]="imageUrl" [ngModelOptions]="{ standalone: true }" placeholder="https://..." />

        <label class="lb">Kimga</label>
        <select class="in" [(ngModel)]="audience" [ngModelOptions]="{ standalone: true }">
          <option value="all">Barcha foydalanuvchilar</option>
          <option value="vip">Faqat VIP obunachilar</option>
          <option value="free">Faqat bepul foydalanuvchilar</option>
        </select>

        <button class="b b-red wide" [disabled]="sending || !text.trim()" (click)="send()">
          {{ sending ? 'Yuborilmoqda...' : 'Yuborish' }}
        </button>
      </div>

      <p class="ap-ok" *ngIf="okMsg">{{ okMsg }}</p>
      <p class="ap-err" *ngIf="error">{{ error }}</p>
    </div>
  `,
  styles: [`
    .ap { padding: 16px; color: #fff; }
    h2 { font-size: 1rem; font-weight: 800; margin: 0; }
    .hint { font-size: 0.72rem; color: #a1a1aa; margin: 6px 0 14px; }
    .form { background: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 14px; }
    .lb { display: block; font-size: 0.72rem; color: #a1a1aa; font-weight: 700; margin: 10px 0 5px; }
    .in, .ta {
      width: 100%; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 10px;
      padding: 10px 12px; color: #fff; font-size: 0.85rem; outline: none;
      font-family: inherit; resize: vertical;
    }
    .b { border: none; border-radius: 12px; padding: 13px; font-size: 0.85rem; font-weight: 800; cursor: pointer; }
    .b-red { background: linear-gradient(135deg, #dc2626, #b91c1c); color: #fff; }
    .wide { width: 100%; margin-top: 14px; }
    .b:disabled { opacity: 0.45; }
    .ap-ok { font-size: 0.8rem; color: #34d399; margin-top: 12px; }
    .ap-err { font-size: 0.8rem; color: #fca5a5; margin-top: 12px; }
  `],
})
export class AdminBroadcastComponent {
  text = '';
  imageUrl = '';
  audience = 'all';
  sending = false;
  okMsg = '';
  error = '';

  constructor(private readonly api: AdminApiService) {}

  send(): void {
    const message = this.text.trim();
    if (!message) { return; }
    this.sending = true;
    this.okMsg = '';
    this.error = '';
    this.api.broadcast({
      message: message,
      imageUrl: this.imageUrl.trim() || undefined,
      audience: this.audience,
    }).subscribe({
      next: (r: any) => {
        this.sending = false;
        const sent = (r && (r.sent || r.count)) || 0;
        this.okMsg = 'Xabar yuborildi' + (sent ? ' (' + sent + ' foydalanuvchi)' : '') + '.';
        this.text = '';
        this.imageUrl = '';
      },
      error: () => { this.sending = false; this.error = 'Yuborilmadi. Server javob bermadi.'; },
    });
  }
}
