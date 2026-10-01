import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminApiService } from './admin-api.service';
import { ApiService } from '../../../core/services/api.service';
import { DialogService } from '../../../core/services/dialog.service';
import { Content, Episode } from '../../../core/models/admin.models';
import { environment } from '../../../../environments/environment';

interface BroadcastResult {
  ok?: boolean;
  error?: string;
  total?: number;
}

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
          <li>Kino yoki qism tanlansa, tugma web app'da aynan shu qismni ochadi. Sotib olganlar darhol ko'radi, olmaganlarga obuna sotib olish oynasi chiqadi</li>
        </ul>
      </div>

      <div class="form">
        <label class="lb">Qaysi kino / dramaga yo'naltirish (ixtiyoriy)</label>
        <div class="target" *ngIf="target">
          <img *ngIf="posterOf(target)" [src]="posterOf(target)" alt="" />
          <div class="target-info">
            <b>{{ target.title }}</b>
            <span>{{ typeLabel(target.type) }}{{ target.isPremium ? ' - pullik' : ' - bepul' }}</span>
          </div>
          <button class="x" (click)="clearTarget()" title="Bekor qilish">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="srch" *ngIf="!target">
          <input class="in" [(ngModel)]="search" placeholder="Kino yoki drama nomi..." (keyup.enter)="findContent()" />
          <button class="b-sm" [disabled]="searching" (click)="findContent()">{{ searching ? '...' : 'Qidirish' }}</button>
        </div>
        <div class="res" *ngIf="!target && results.length">
          <button class="res-i" *ngFor="let c of results" (click)="chooseContent(c)">
            <img *ngIf="posterOf(c)" [src]="posterOf(c)" alt="" />
            <span class="res-t">{{ c.title }}</span>
            <span class="res-k">{{ typeLabel(c.type) }}</span>
          </button>
        </div>

        <ng-container *ngIf="target && targetEpisodes.length">
          <label class="lb">Qism</label>
          <select class="in" [ngModel]="targetEpId" (ngModelChange)="targetEpId = $event; applyTarget()">
            <option value="">Boshidan (1-qism)</option>
            <option *ngFor="let e of targetEpisodes" [value]="e.id">
              {{ e.seasonNumber > 1 ? (e.seasonNumber + '-fasl, ') : '' }}{{ e.episodeNumber }}-qism {{ e.isFree ? '(bepul)' : '(pullik)' }}
            </option>
          </select>
        </ng-container>

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
            <input class="in" [(ngModel)]="buttonUrl" placeholder="https://..." [readonly]="!!target" />
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
    .in[readonly] { color: #a1a1aa; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .srch { display: flex; gap: 8px; }
    .b-sm { flex: 0 0 auto; border: none; border-radius: 10px; padding: 0 14px; background: #27272a; color: #fff; font-weight: 800; font-size: 0.75rem; cursor: pointer; }
    .b-sm:disabled { opacity: 0.5; }
    .res { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; }
    .res-i { display: flex; align-items: center; gap: 10px; padding: 6px; border-radius: 10px; border: 1px solid #27272a; background: #0f0f0f; color: #fff; text-align: left; cursor: pointer; }
    .res-i img { width: 32px; height: 46px; object-fit: cover; border-radius: 6px; flex: 0 0 auto; }
    .res-t { flex: 1; min-width: 0; font-size: 0.8rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .res-k { font-size: 0.65rem; color: #a1a1aa; flex: 0 0 auto; }
    .target { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 12px; border: 1px solid rgba(220,38,38,0.5); background: rgba(69,10,10,0.35); }
    .target img { width: 40px; height: 58px; object-fit: cover; border-radius: 6px; flex: 0 0 auto; }
    .target-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .target-info b { font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .target-info span { font-size: 0.68rem; color: #fca5a5; }
    .x { border: none; background: rgba(255,255,255,0.06); border-radius: 50%; padding: 6px; display: flex; cursor: pointer; }
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

  /** Kontentga yo'naltirish */
  search = '';
  searching = false;
  results: Content[] = [];
  target: Content | null = null;
  targetEpisodes: Episode[] = [];
  targetEpId = '';
  private autoImage = false;

  private readonly origin = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
  private readonly webOrigin = window.location.origin;
  private readonly defaultButton = 'Veb appka kirish';
  private readonly watchButton = "Ko'rish";

  constructor(
    private readonly api: AdminApiService,
    private readonly pub: ApiService,
    private readonly http: HttpClient,
    private readonly dlg: DialogService,
  ) {}

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private abs(u: string | null | undefined): string {
    if (!u) { return ''; }
    if (/^https?:\/\//i.test(u)) { return u; }
    return this.origin + (u.charAt(0) === '/' ? u : '/' + u);
  }

  posterOf(c: Content | null): string {
    return c ? this.abs(c.posterUrl) : '';
  }

  typeLabel(t: string | undefined): string {
    switch (t) {
      case 'movie': return 'Kino';
      case 'series': return 'Serial';
      case 'short_drama': return 'Mini drama';
      case 'anime': return 'Anime';
      case 'cartoon': return 'Multfilm';
      default: return t || 'Kontent';
    }
  }

  private audienceLabel(): string {
    if (this.audience === 'vip') { return 'faqat VIP obunachilarga'; }
    if (this.audience === 'free') { return 'faqat bepul foydalanuvchilarga'; }
    return 'barcha foydalanuvchilarga';
  }

  findContent(): void {
    const q = this.search.trim();
    if (q.length < 2) { this.error = 'Kamida 2 ta harf yozing.'; return; }
    this.searching = true;
    this.error = '';
    this.pub.getContent({ search: q, limit: 15 }).subscribe({
      next: (r) => {
        this.searching = false;
        const raw: unknown = r;
        let list: unknown[] = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
          list = (raw as { data: unknown[] }).data;
        }
        this.results = list as Content[];
        if (!this.results.length) { this.error = 'Hech narsa topilmadi.'; }
      },
      error: () => { this.searching = false; this.error = 'Qidiruvda xato yuz berdi.'; },
    });
  }

  chooseContent(c: Content): void {
    this.target = c;
    this.results = [];
    this.targetEpId = '';
    this.targetEpisodes = [];
    this.error = '';
    this.applyTarget();
    this.pub.getContentById(c.id).subscribe({
      next: (r: unknown) => {
        let full: Content | null = null;
        if (r && typeof r === 'object') {
          const o = r as { data?: Content };
          full = (o.data && typeof o.data === 'object' ? o.data : (r as Content));
        }
        if (full && full.id) { this.target = full; }
        const eps: Episode[] = (full && Array.isArray(full.episodes)) ? full.episodes : [];
        this.targetEpisodes = eps.slice().sort((a, b) => {
          const s = (a.seasonNumber || 1) - (b.seasonNumber || 1);
          return s !== 0 ? s : (a.episodeNumber || 0) - (b.episodeNumber || 0);
        });
        this.applyTarget();
      },
      error: () => { this.applyTarget(); },
    });
  }

  /** Tanlangan kontent/qism bo'yicha tugma havolasi va rasmni tayyorlaydi. */
  applyTarget(): void {
    if (!this.target) { return; }
    let url = this.webOrigin + '/?open=' + encodeURIComponent(this.target.id);
    if (this.targetEpId) { url += '&ep=' + encodeURIComponent(this.targetEpId); }
    this.buttonUrl = url;
    if (!this.buttonText.trim() || this.buttonText === this.defaultButton) {
      this.buttonText = this.watchButton;
    }
    const poster = this.posterOf(this.target);
    if (poster && (!this.imageUrl || this.autoImage)) {
      this.imageUrl = poster;
      this.autoImage = true;
    }
  }

  clearTarget(): void {
    this.target = null;
    this.targetEpisodes = [];
    this.targetEpId = '';
    this.buttonUrl = this.webOrigin;
    if (this.buttonText === this.watchButton) { this.buttonText = this.defaultButton; }
    if (this.autoImage) { this.imageUrl = ''; this.autoImage = false; }
  }

  onImage(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) { return; }
    const fd = new FormData();
    fd.append('poster', file);
    this.uploading = true;
    this.error = '';
    this.http.post<{ url?: string }>(environment.apiUrl + '/upload/poster', fd).subscribe({
      next: (r) => {
        this.uploading = false;
        const u: string = (r && r.url) || '';
        this.imageUrl = u.charAt(0) === '/' ? this.origin + u : u;
        this.autoImage = false;
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
      const payload: Record<string, unknown> = { text: message, audience: this.audience };
      if (this.imageUrl.trim()) { payload['photoUrl'] = this.imageUrl.trim(); }
      if (this.buttonText.trim() && btnUrl) {
        payload['buttonText'] = this.buttonText.trim();
        payload['buttonUrl'] = btnUrl;
      }
      this.sending = true;
      this.okMsg = '';
      this.error = '';
      this.api.broadcast(payload).subscribe({
        next: (r: BroadcastResult | null) => {
          this.sending = false;
          if (r && r.ok === false) { this.error = r.error || 'Yuborilmadi'; return; }
          this.okMsg = 'Xabar yuborilmoqda (' + ((r && r.total) || 0) + ' foydalanuvchi). Bir necha daqiqa oladi.';
          this.title = '';
          this.text = '';
          this.imageUrl = '';
          this.autoImage = false;
          this.clearTarget();
        },
        error: () => { this.sending = false; this.error = 'Yuborilmadi. Server javob bermadi.'; },
      });
    });
  }
}
