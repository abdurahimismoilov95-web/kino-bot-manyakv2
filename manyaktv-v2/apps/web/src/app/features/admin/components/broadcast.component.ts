import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminApiService } from './admin-api.service';
import { environment } from '../../../../environments/environment';

/** v1 AdminPanel -> "Xabar Yuborish" bolimi (Telegram bot orqali). */
@Component({
  selector: 'app-admin-broadcast',
  template: `
    <div class="ap">
      <h2>&#128226; Barcha foydalanuvchilarga xabar yuborish</h2>
      <p class="hint">Telegram bot orqali bildirishnoma yuboriladi.</p>

      <div class="note">
        <b>Eslatma:</b>
        <ul>
          <li>Xabar ro'yxatdan o'tgan foydalanuvchilarga yuboriladi</li>
          <li>Yuborish bir necha daqiqa davom etishi mumkin</li>
        </ul>
      </div>

      <div class="form">
        <label class="lb">Sarlavha</label>
        <input class="in" [(ngModel)]="title" placeholder="Yangi kinolar!" />

        <label class="lb">Xabar matni</label>
        <textarea class="in" rows="5" [(ngModel)]="text" placeholder="Salom! MANYAK TV da..."></textarea>

        <label class="lb">Rasm (ixtiyoriy)</label>
        <label class="drop">
          <span>{{ uploading ? 'Yuklanmoqda...' : (imageUrl ? 'Rasm tayyor (almashtirish)' : 'Rasm tanlang') }}</span>
          <input type="file" accept="image/*" (change)="onImage($event)" hidden />
        </label>
        <input class="in" [(ngModel)]="imageUrl" placeholder="yoki rasm URL" />

        <div class="row2">
          <div>
            <label class="lb">Tugma matni</label>
            <input class="in" [(ngModel)]="buttonText" />
          </div>
          <div>
            <label class="lb">Tugma havolasi</label>
            <input class="in" [(ngModel)]="buttonUrl" placeholder="https://..." />
          </div>
        </div>

        <label class="lb">Kimga</label>
        <select class="in" [(ngModel)]="audience">
          <option value="all">Barcha foydalanuvchilar</option>
          <option value="vip">Faqat VIP obunachilar</option>
          <option value="free">Faqat bepul foydalanuvchilar</option>
        </select>

        <button class="b b-red" [disabled]="sending || uploading || !text.trim()" (click)="send()">
          {{ sending ? 'Yuborilmoqda...' : 'Yuborish' }}
        </button>
      </div>

      <p class="ok" *ngIf="okMsg">{{ okMsg }}</p>
      <p class="er" *ngIf="error">{{ error }}</p>
    </div>
  `,
  styles: [`
    .ap { padding: 16px; color: #fff; max-width: 640px; }
    h2 { font-size: 1rem; font-weight: 800; margin: 0; }
    .hint { font-size: 0.72rem; color: #a1a1aa; margin: 6px 0 12px; }
    .note { background: rgba(120, 53, 15, 0.25); border: 1px solid rgba(146, 64, 14, 0.5); color: #fcd34d; border-radius: 12px; padding: 10px 12px; font-size: 0.72rem; margin-bottom: 12px; }
    .note ul { margin: 4px 0 0; padding-left: 18px; }
    .form { background: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 14px; }
    .lb { display: block; font-size: 0.68rem; color: #a1a1aa; font-weight: 800; margin: 10px 0 5px; text-transform: uppercase; }
    .in { width: 100%; box-sizing: border-box; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 10px; padding: 10px 12px; color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .drop { display: flex; align-items: center; justify-content: center; min-height: 48px; margin-bottom: 6px; border: 2px dashed #3f3f46; border-radius: 10px; background: #09090b; color: #d4d4d8; font-size: 0.75rem; cursor: pointer; }
    .b { width: 100%; margin-top: 14px; border: none; border-radius: 12px; padding: 13px; font-size: 0.85rem; font-weight: 800; cursor: pointer; color: #fff; }
    .b-red { background: linear-gradient(135deg, #dc2626, #b91c1c); }
    .b:disabled { opacity: 0.45; }
    .ok { font-size: 0.8rem; color: #34d399; margin-top: 12px; }
    .er { font-size: 0.8rem; color: #fca5a5; margin-top: 12px; }
  `],
})
export class AdminBroadcastComponent {
  title = '';
  text = '';
  imageUrl = '';
  buttonText = 'Veb appka kirish';
  buttonUrl = window.location.origin;
  audience = 'all';
  sending = false;
  uploading = false;
  okMsg = '';
  error = '';

  private readonly origin = environment.apiUrl.replace(/\/api\/v1\/?$/, '');

  constructor(
    private readonly api: AdminApiService,
    private readonly http: HttpClient,
  ) {}

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  onImage(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) { return; }
    const fd = new FormData();
    fd.append('poster', file);
    this.uploading = true;
    this.error = '';
    this.http.post<any>(environment.apiUrl + '/upload/poster', fd).subscribe({
      next: (r: any) => {
        this.uploading = false;
        const u: string = (r && r.url) || '';
        this.imageUrl = u.charAt(0) === '/' ? this.origin + u : u;
      },
      error: () => { this.uploading = false; this.error = 'Rasm yuklanmadi'; },
    });
    input.value = '';
  }

  send(): void {
    const body = this.text.trim();
    if (!body) { return; }
    const head = this.title.trim();
    const message = (head ? '<b>' + this.esc(head) + '</b>\n\n' : '') + this.esc(body);
    const payload: any = { text: message, audience: this.audience };
    if (this.imageUrl.trim()) { payload.photoUrl = this.imageUrl.trim(); }
    if (this.buttonText.trim() && this.buttonUrl.trim()) {
      payload.buttonText = this.buttonText.trim();
      payload.buttonUrl = this.buttonUrl.trim();
    }
    this.sending = true;
    this.okMsg = '';
    this.error = '';
    this.api.broadcast(payload).subscribe({
      next: (r: any) => {
        this.sending = false;
        if (r && r.ok === false) { this.error = r.error || 'Yuborilmadi'; return; }
        this.okMsg = 'Xabar yuborilmoqda (' + ((r && r.total) || 0) + ' foydalanuvchi). Bir necha daqiqa oladi.';
        this.title = '';
        this.text = '';
        this.imageUrl = '';
      },
      error: () => { this.sending = false; this.error = 'Yuborilmadi. Server javob bermadi.'; },
    });
  }
}
