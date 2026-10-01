import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminApiService } from './admin-api.service';
import { DialogService } from '../../../core/services/dialog.service';
import { environment } from '../../../../environments/environment';

/** v1 AdminPanel -> "Xabar Yuborish" bolimi (Telegram bot orqali). */
@Component({
  selector: 'app-admin-broadcast',
  template: `
    <div class="ap">
      <h2>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M16 8a5 5 0 0 1 0 8"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>
        <span>Barcha foydalanuvchilarga xabar yuborish</span>
      </h2>
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          <span>{{ uploading ? 'Yuklanmoqda...' : (imageUrl ? 'Rasm tayyor (almashtirish)' : 'Rasm tanlang') }}</span>
          <input type="file" accept="image/*" (change)="onImage($event)" hidden />
        </label>
        <img *ngIf="imageUrl" class="prev" [src]="imageUrl" alt="" />

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
    h2 { display: flex; align-items: center; gap: 8px; font-size: 1rem; font-weight: 800; margin: 0; }
    h2 svg { flex: 0 0 auto; }
    .hint { font-size: 0.72rem; color: #a1a1aa; margin: 6px 0 12px; }
    .note { background: rgba(120, 53, 15, 0.25); border: 1px solid rgba(146, 64, 14, 0.5); color: #fcd34d; border-radius: 12px; padding: 10px 12px; font-size: 0.72rem; margin-bottom: 12px; }
    .note ul { margin: 4px 0 0; padding-left: 18px; }
    .form { background: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 14px; }
    .lb { display: block; font-size: 0.68rem; color: #a1a1aa; font-weight: 800; margin: 10px 0 5px; text-transform: uppercase; }
    .in { width: 100%; box-sizing: border-box; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 10px; padding: 10px 12px; color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .drop { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; margin-bottom: 6px; border: 2px dashed #3f3f46; border-radius: 10px; background: #09090b; color: #d4d4d8; font-size: 0.75rem; cursor: pointer; }
    .prev { display: block; width: 100%; max-height: 160px; object-fit: cover; border-radius: 10px; margin-top: 4px; }
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
    private readonly dlg: DialogService,
  ) {}

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private audienceLabel(): string {
    if (this.audience === 'vip') { return 'faqat VIP obunachilarga'; }
    if (this.audience === 'free') { return 'faqat bepul foydalanuvchilarga'; }
    return 'barcha foydalanuvchilarga';
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
    const btnUrl = this.buttonUrl.trim();
    if (btnUrl && !/^https:\/\//i.test(btnUrl)) { this.error = 'Tugma havolasi https:// bilan boshlanishi kerak.'; return; }
    this.dlg.confirm('Xabar ' + this.audienceLabel() + ' yuborilsinmi? Bu amalni bekor qilib bolmaydi.', { title: 'Xabar yuborish', okText: 'Yuborish' }).then((ok) => {
      if (!ok) { return; }
      const head = this.title.trim();
      const message = (head ? '<b>' + this.esc(head) + '</b>\n\n' : '') + this.esc(body);
      const payload: any = { text: message, audience: this.audience };
      if (this.imageUrl.trim()) { payload.photoUrl = this.imageUrl.trim(); }
      if (this.buttonText.trim() && btnUrl) {
        payload.buttonText = this.buttonText.trim();
        payload.buttonUrl = btnUrl;
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
    });
  }
}
