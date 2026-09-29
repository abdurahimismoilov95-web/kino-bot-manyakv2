import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { ApiService } from '../../../core/services/api.service';
import { AdminApiService } from './admin-api.service';
import { environment } from '../../../../environments/environment';

interface UploadState { progress: number; status: string; name: string; }

@Component({
  selector: 'app-admin-content',
  template: `
    <div class="ct">
      <div class="head">
        <div>
          <h3 class="h">Kino va Dramalar Katalogi</h3>
          <p class="sub">Yangi kino qo'shing yoki video yuklang</p>
        </div>
        <button class="b b-red" (click)="openEditor()">+ Yangi Qo'shish</button>
      </div>

      <div class="chips">
        <button *ngFor="let f of filters" class="chip" [class.on]="filter === f.v" (click)="filter = f.v">{{ f.t }}</button>
      </div>

      <div *ngIf="loading" class="empty">Yuklanmoqda...</div>
      <div *ngIf="!loading && visible().length === 0" class="empty">Kontent yo'q</div>

      <div class="grid">
        <div class="card" *ngFor="let c of visible()">
          <img class="cp" [src]="abs(c.posterUrl)" [alt]="c.title" />
          <div class="ci">
            <div>
              <div class="ct-t">{{ c.title }}</div>
              <div class="meta">{{ c.year }} &bull; <span class="ty">{{ c.type }}</span></div>
              <div class="meta">
                <span class="price">{{ c.price > 0 ? (c.price + ' som') : 'Bepul' }}</span>
                <span class="tag" *ngIf="c.isVipIncluded === false">VIP emas</span>
                <span class="tag g" *ngIf="c.isVipIncluded !== false">VIP rejasida</span>
              </div>
              <div class="meta am" *ngIf="c.episodes && c.episodes.length">{{ c.episodes.length }} ta epizod</div>
            </div>
            <div class="act">
              <button class="ib" title="Telegramda e'lon qilish" (click)="announce(c)">&#128227;</button>
              <button class="ib" title="Tahrirlash" (click)="openEditor(c)">&#9998;</button>
              <button class="ib d" title="O'chirish" (click)="remove(c)">&#10005;</button>
            </div>
          </div>
        </div>
      </div>

      <p class="ok" *ngIf="okMsg">{{ okMsg }}</p>
      <p class="er" *ngIf="error">{{ error }}</p>
    </div>

    <div class="ov" *ngIf="editing">
      <div class="md">
        <button class="x" (click)="closeEditor()">&#10005;</button>
        <h3 class="mh">{{ editing.id ? 'Kontentni Tahrirlash' : 'Yangi Kontent' }}</h3>

        <label class="lb">Nomi</label>
        <input class="in" [(ngModel)]="editing.title" />

        <label class="lb">Turi</label>
        <select class="in" [(ngModel)]="editing.type">
          <option value="movie">Kino</option>
          <option value="series">Serial</option>
          <option value="anime_series">Anime</option>
          <option value="short_drama">Mini Drama (9:16)</option>
        </select>

        <label class="lb">Ekrandagi katalog (bo'lim)</label>
        <select class="in" [(ngModel)]="editing.catalogId" (ngModelChange)="onCatalog($event)">
          <option value="">Katalog tanlang</option>
          <option *ngFor="let k of catalogs" [value]="k.id">{{ k.title || k.name }}</option>
        </select>

        <label class="lb">Poster</label>
        <div class="box">
          <img *ngIf="editing.posterUrl" class="prev" [src]="abs(editing.posterUrl)" />
          <label class="drop">
            <span *ngIf="!up['poster']">{{ editing.posterUrl ? 'Poster tayyor - boshqasini tanlash' : 'Rasm tanlash (galereya)' }}</span>
            <span *ngIf="up['poster']">{{ up['poster'].status === 'ok' ? ('Yuklandi: ' + up['poster'].name) : ('Yuklanmoqda... ' + up['poster'].progress + '%') }}</span>
            <input type="file" accept="image/*" (change)="onFile($event, 'poster')" hidden />
          </label>
          <div class="bar" *ngIf="up['poster'] && up['poster'].status === 'loading'"><div class="fill" [style.width.%]="up['poster'].progress"></div></div>
        </div>

        <ng-container *ngIf="editing.type === 'movie'">
          <label class="lb">Video fayl (kino)</label>
          <div class="box">
            <label class="drop">
              <span *ngIf="!up['video']">{{ editing.videoUrl ? 'Video tayyor - boshqasini tanlash' : 'Video tanlash (galereya)' }}</span>
              <span *ngIf="up['video']">{{ up['video'].status === 'ok' ? ('Yuklandi: ' + up['video'].name) : ('Video yuklanmoqda... ' + up['video'].progress + '%') }}</span>
              <input type="file" accept="video/*" (change)="onFile($event, 'video')" hidden />
            </label>
            <div class="bar" *ngIf="up['video'] && up['video'].status === 'loading'"><div class="fill" [style.width.%]="up['video'].progress"></div></div>
          </div>
        </ng-container>

        <label class="lb">Yil</label>
        <input class="in" type="number" [(ngModel)]="editing.year" />

        <label class="lb">Davomiyligi</label>
        <input class="in" [(ngModel)]="editing.duration" placeholder="1s 45d" />

        <label class="lb">Janrlar (vergul bilan)</label>
        <input class="in" [(ngModel)]="genresText" placeholder="Drama, Komediya" />

        <div class="mon">
          <div class="lb first">Monetizatsiya sozlamalari</div>
          <label class="ck"><input type="checkbox" [(ngModel)]="editing.isVipIncluded" /> VIP'ga kiradi</label>
          <label class="ck"><input type="checkbox" [(ngModel)]="editing.isSinglePurchase" /> Alohida sotuvda</label>
          <label class="ck"><input type="checkbox" [(ngModel)]="editing.isPremium" /> Faqat VIP</label>
          <label class="ck"><input type="checkbox" [(ngModel)]="editing.isFeatured" /> #1 Premyera</label>
          <label class="ck"><input type="checkbox" [(ngModel)]="editing.isTrending" /> Trend</label>
          <label class="lb">Narxi (so'm)</label>
          <input class="in" type="number" [(ngModel)]="editing.price" placeholder="15000" />
        </div>

        <label class="lb">Tavsif</label>
        <textarea class="in" rows="3" [(ngModel)]="editing.description" placeholder="Kino haqida qisqacha..."></textarea>

        <div *ngIf="editing.type !== 'movie'" class="eps">
          <div class="epsh">
            <span class="lb first">Epizodlar ({{ episodes.length }})</span>
            <button class="b b-gray" (click)="addEpisode()">+ Qism qo'shish</button>
          </div>
          <div class="ep" *ngFor="let ep of episodes; let i = index">
            <div class="epn">{{ ep.episodeNumber }}-qism</div>
            <input class="in" [(ngModel)]="ep.title" placeholder="Qism nomi" />
            <label class="drop sm">
              <span *ngIf="!up['ep' + i]">{{ ep.videoUrl ? 'Video tayyor - almashtirish' : 'Video tanlash' }}</span>
              <span *ngIf="up['ep' + i]">{{ up['ep' + i].status === 'ok' ? 'Yuklandi' : ('Yuklanmoqda... ' + up['ep' + i].progress + '%') }}</span>
              <input type="file" accept="video/*" (change)="onEpisodeFile($event, i)" hidden />
            </label>
            <button class="ib d" (click)="removeEpisode(i)">O'chirish</button>
          </div>
        </div>

        <label class="ck big" *ngIf="!editing.id">
          <input type="checkbox" [(ngModel)]="shouldBroadcast" /> Saqlangach Telegramda barchaga e'lon qilish
        </label>

        <p class="er" *ngIf="formError">{{ formError }}</p>

        <div class="foot">
          <button class="b b-gray" (click)="closeEditor()">Bekor</button>
          <button class="b b-red" [disabled]="saving || uploading()" (click)="save()">
            {{ saving ? 'Saqlanmoqda...' : (uploading() ? 'Yuklanmoqda...' : 'Saqlash') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ct { padding: 16px; color: #fff; }
    .head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; }
    .h { font-size: 1rem; font-weight: 800; margin: 0; }
    .sub { font-size: 0.72rem; color: #a1a1aa; margin: 3px 0 0; }
    .b { border: none; border-radius: 12px; padding: 10px 14px; font-size: 0.78rem; font-weight: 800; cursor: pointer; color: #fff; }
    .b-red { background: #dc2626; }
    .b-gray { background: #27272a; color: #d4d4d8; }
    .b:disabled { opacity: 0.5; }
    .chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; }
    .chip { border: none; border-radius: 8px; padding: 6px 12px; font-size: 0.72rem; font-weight: 700; background: #27272a; color: #a1a1aa; white-space: nowrap; cursor: pointer; }
    .chip.on { background: #fff; color: #000; }
    .grid { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 8px; }
    @media (min-width: 640px) { .grid { grid-template-columns: 1fr 1fr; } }
    .card { display: flex; gap: 10px; padding: 10px; background: #18181b; border: 1px solid #27272a; border-radius: 12px; }
    .cp { width: 64px; height: 90px; object-fit: cover; border-radius: 8px; background: #09090b; flex-shrink: 0; }
    .ci { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; }
    .ct-t { font-size: 0.8rem; font-weight: 800; }
    .meta { font-size: 0.68rem; color: #a1a1aa; margin-top: 3px; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .ty { color: #f87171; font-weight: 700; text-transform: uppercase; }
    .price { color: #34d399; font-weight: 800; }
    .tag { font-size: 0.6rem; background: #451a03; color: #fcd34d; border-radius: 4px; padding: 1px 5px; }
    .tag.g { background: #27272a; color: #d4d4d8; }
    .am { color: #fbbf24; }
    .act { display: flex; justify-content: flex-end; gap: 6px; padding-top: 6px; border-top: 1px solid #27272a; margin-top: 6px; }
    .ib { border: 1px solid #3f3f46; background: #27272a; color: #d4d4d8; border-radius: 8px; padding: 5px 9px; cursor: pointer; font-size: 0.8rem; }
    .ib.d { color: #f87171; }
    .empty { text-align: center; color: #71717a; padding: 24px; font-size: 0.85rem; }
    .ok { color: #34d399; font-size: 0.8rem; margin-top: 10px; }
    .er { color: #fca5a5; font-size: 0.8rem; margin-top: 10px; }
    .ov { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.9); display: flex; align-items: flex-start; justify-content: center; padding: 12px; overflow-y: auto; }
    .md { position: relative; width: 100%; max-width: 520px; background: #121216; border: 1px solid #27272a; border-radius: 14px; padding: 16px; margin: auto; }
    .x { position: absolute; top: 10px; right: 10px; border: none; background: #27272a; color: #a1a1aa; border-radius: 8px; padding: 4px 8px; cursor: pointer; }
    .mh { font-size: 1rem; font-weight: 900; margin: 0 0 10px; padding-bottom: 10px; border-bottom: 1px solid #27272a; }
    .lb { display: block; font-size: 0.68rem; font-weight: 800; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.04em; margin: 14px 0 5px; }
    .lb.first { margin-top: 0; }
    .in { display: block; width: 100%; box-sizing: border-box; background: #18181b; border: 1px solid #3f3f46; border-radius: 10px; padding: 11px 12px; color: #fff; font-size: 0.85rem; outline: none; font-family: inherit; }
    .box { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 10px; }
    .prev { display: block; width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; }
    .drop { display: flex; align-items: center; justify-content: center; text-align: center; min-height: 64px; border: 2px dashed #3f3f46; border-radius: 10px; background: #09090b; color: #d4d4d8; font-size: 0.8rem; cursor: pointer; padding: 8px; word-break: break-all; }
    .drop.sm { min-height: 40px; margin: 6px 0; }
    .bar { height: 5px; background: #27272a; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .fill { height: 5px; background: #dc2626; transition: width 0.2s; }
    .mon { margin-top: 14px; padding: 12px; border: 1px solid #27272a; border-radius: 12px; background: #18181b; }
    .ck { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 700; padding: 7px 0; }
    .ck.big { margin-top: 14px; color: #60a5fa; }
    .eps { margin-top: 14px; padding: 12px; border: 1px solid #27272a; border-radius: 12px; background: #18181b; }
    .epsh { display: flex; justify-content: space-between; align-items: center; }
    .ep { display: flex; flex-direction: column; gap: 6px; padding: 10px; margin-top: 8px; background: #09090b; border: 1px solid #27272a; border-radius: 10px; }
    .epn { font-size: 0.75rem; font-weight: 800; color: #fbbf24; }
    .foot { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
  `],
})
export class AdminContentComponent implements OnInit {
  items: any[] = [];
  catalogs: any[] = [];
  loading = false;
  filter = 'all';
  filters = [
    { v: 'all', t: 'Barchasi' },
    { v: 'movie', t: 'Kinolar' },
    { v: 'series', t: 'Seriallar' },
    { v: 'anime_series', t: 'Animelar' },
    { v: 'short_drama', t: 'Mini Dramalar' },
  ];

  editing: any = null;
  episodes: any[] = [];
  genresText = '';
  shouldBroadcast = false;
  saving = false;
  formError = '';
  okMsg = '';
  error = '';
  up: Record<string, UploadState> = {};

  private readonly origin = environment.apiUrl.replace(/\/api\/v1\/?$/, '');

  constructor(
    private readonly api: ApiService,
    private readonly adminApi: AdminApiService,
    private readonly http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.load();
    this.adminApi.getCatalogs().subscribe({
      next: (r: any) => { this.catalogs = (r && r.catalogs) || (Array.isArray(r) ? r : []); },
      error: () => { this.catalogs = []; },
    });
  }

  abs(u: string | null | undefined): string {
    if (!u) { return ''; }
    return u.charAt(0) === '/' ? this.origin + u : u;
  }

  visible(): any[] {
    return this.items.filter((c) => this.filter === 'all' || c.type === this.filter);
  }

  load(): void {
    this.loading = true;
    this.api.getContent({ page: 1, limit: 100 }).subscribe({
      next: (r: any) => { this.items = r.data || []; this.loading = false; },
      error: () => { this.loading = false; this.error = 'Kontent ro\'yxati yuklanmadi'; },
    });
  }

  openEditor(item?: any): void {
    this.formError = '';
    this.up = {};
    this.shouldBroadcast = false;
    if (item) {
      this.editing = Object.assign({}, item);
      this.genresText = Array.isArray(item.genres) ? item.genres.join(', ') : (item.genres || '');
      this.editing.catalogId = item.catalogId || '';
      this.api.getContentById(item.id).subscribe({
        next: (full: any) => { this.episodes = (full.episodes || []).map((e: any) => Object.assign({}, e)); },
        error: () => { this.episodes = []; },
      });
      this.episodes = [];
    } else {
      this.editing = {
        title: '', originalTitle: '', type: 'movie', catalogId: '', posterUrl: '', videoUrl: '',
        description: '', year: new Date().getFullYear(), duration: '', rating: 7.5, price: 0,
        isPremium: false, isVipIncluded: true, isSinglePurchase: false, isFeatured: false, isTrending: false,
      };
      this.genresText = '';
      this.episodes = [];
    }
  }

  closeEditor(): void {
    this.editing = null;
    this.up = {};
  }

  onCatalog(id: string): void {
    const k = this.catalogs.find((c) => c.id === id);
    if (k && k.format === 'vertical_9_16') { this.editing.type = 'short_drama'; }
  }

  addEpisode(): void {
    const n = this.episodes.length + 1;
    this.episodes.push({ seasonNumber: 1, episodeNumber: n, title: n + '-qism', videoUrl: '' });
  }

  removeEpisode(i: number): void {
    this.episodes.splice(i, 1);
    this.episodes.forEach((e, idx) => { e.episodeNumber = idx + 1; });
    this.up = {};
  }

  uploading(): boolean {
    return Object.keys(this.up).some((k) => this.up[k].status === 'loading');
  }

  onFile(ev: Event, kind: 'poster' | 'video'): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) { return; }
    this.doUpload(file, kind, kind, (url) => {
      if (kind === 'poster') { this.editing.posterUrl = url; } else { this.editing.videoUrl = url; }
    });
    input.value = '';
  }

  onEpisodeFile(ev: Event, i: number): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) { return; }
    this.doUpload(file, 'video', 'ep' + i, (url) => { this.episodes[i].videoUrl = url; });
    input.value = '';
  }

  private doUpload(file: File, kind: 'poster' | 'video', key: string, done: (url: string) => void): void {
    const fd = new FormData();
    fd.append(kind, file);
    this.up[key] = { progress: 0, status: 'loading', name: file.name };
    this.formError = '';
    this.http.post<any>(environment.apiUrl + '/upload/' + kind, fd, { reportProgress: true, observe: 'events' }).subscribe({
      next: (e: any) => {
        if (e.type === HttpEventType.UploadProgress && e.total) {
          this.up[key] = { progress: Math.round((100 * e.loaded) / e.total), status: 'loading', name: file.name };
        } else if (e.type === HttpEventType.Response) {
          const b = e.body || {};
          let url: string = b.url || (b.filename ? '/uploads/videos/' + b.filename : '');
          if (url && url.charAt(0) === '/') { url = this.origin + url; }
          this.up[key] = { progress: 100, status: 'ok', name: file.name };
          done(url);
        }
      },
      error: (err: any) => {
        delete this.up[key];
        this.formError = 'Yuklash xatosi: ' + ((err && err.error && err.error.message) || (err && err.status) || 'server javob bermadi');
      },
    });
  }

  save(): void {
    const e = this.editing;
    this.formError = '';
    if (!e.title || !String(e.title).trim()) { this.formError = 'Kontent nomini kiriting'; return; }
    if (!e.posterUrl || !String(e.posterUrl).trim()) { this.formError = 'Poster rasmini yuklang'; return; }
    if (e.type === 'movie' && (!e.videoUrl || !String(e.videoUrl).trim())) { this.formError = 'Video faylni yuklang'; return; }
    if (e.type !== 'movie' && this.episodes.length === 0) { this.formError = 'Kamida 1 ta epizod qo\'shing'; return; }

    const genres = this.genresText.split(',').map((g) => g.trim()).filter((g) => g.length > 0);
    const data: any = {
      title: String(e.title).trim(),
      originalTitle: e.originalTitle || null,
      type: e.type,
      catalogId: e.catalogId || null,
      posterUrl: e.posterUrl,
      bannerUrl: e.bannerUrl || e.posterUrl,
      videoUrl: e.type === 'movie' ? e.videoUrl : null,
      description: e.description || null,
      year: Number(e.year) || null,
      duration: e.duration || null,
      rating: Number(e.rating) || 0,
      genres: genres,
      isPremium: !!e.isPremium,
      isVipIncluded: e.isVipIncluded !== false,
      isSinglePurchase: !!e.isSinglePurchase,
      price: Number(e.price) || 0,
      isTrending: !!e.isTrending,
      isFeatured: !!e.isFeatured,
    };
    if (e.type !== 'movie') {
      data.episodes = this.episodes.map((ep, i) => ({
        seasonNumber: ep.seasonNumber || 1,
        episodeNumber: i + 1,
        title: ep.title || (i + 1) + '-qism',
        videoUrl: ep.videoUrl || null,
      }));
    }

    this.saving = true;
    const isNew = !e.id;
    const req = isNew ? this.api.createContent(data) : this.api.updateContent(e.id, data);
    req.subscribe({
      next: (saved: any) => {
        this.saving = false;
        const announceIt = isNew && this.shouldBroadcast;
        this.closeEditor();
        this.okMsg = 'Saqlandi: ' + saved.title;
        this.load();
        if (announceIt) { this.sendAnnounce(saved); }
      },
      error: (err: any) => {
        this.saving = false;
        const m = err && err.error && err.error.message;
        this.formError = 'Saqlanmadi: ' + (Array.isArray(m) ? m.join(', ') : (m || err.status || 'server xatosi'));
      },
    });
  }

  remove(c: any): void {
    if (!confirm(c.title + ' o\'chirilsinmi?')) { return; }
    this.api.deleteContent(c.id).subscribe({
      next: () => { this.items = this.items.filter((i) => i.id !== c.id); },
      error: () => { this.error = 'O\'chirilmadi'; },
    });
  }

  announce(c: any): void {
    if (!confirm('"' + c.title + '" haqida barcha foydalanuvchilarga xabar yuborilsinmi?')) { return; }
    this.sendAnnounce(c);
  }

  private esc(s: string): string {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private sendAnnounce(c: any): void {
    const kind = c.type === 'movie' ? 'kino' : (c.type === 'short_drama' ? 'mini drama' : 'serial');
    const desc = String(c.description || '');
    const text = '<b>Yangi ' + kind + ' qo\'shildi!</b>\n\n<b>' + this.esc(c.title) + '</b>\n\n' +
      this.esc(desc.substring(0, 200)) + (desc.length > 200 ? '...' : '');
    this.okMsg = '';
    this.error = '';
    this.adminApi.broadcast({
      text: text,
      photoUrl: this.abs(c.posterUrl),
      buttonText: 'Tomosha qilish',
      buttonUrl: window.location.origin + '/watch/' + c.id,
      audience: 'all',
    }).subscribe({
      next: (r: any) => { this.okMsg = 'E\'lon yuborilmoqda (' + ((r && r.total) || 0) + ' foydalanuvchi)'; },
      error: () => { this.error = 'E\'lon yuborilmadi'; },
    });
  }
}
