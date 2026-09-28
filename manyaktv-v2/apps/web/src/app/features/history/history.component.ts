import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

/** manyak-tv1 HistoryView.tsx dizayni */
@Component({
  selector: 'app-history',
  template: `
    <div class="hv">
      <div class="hv-tabs">
        <button class="hv-tab" [class.hv-on]="tab === 'history'" (click)="tab = 'history'">
          <span class="hv-tab-ico">&#8635;</span>
          <span>Korish Tarixi</span>
          <small>({{ history.length }})</small>
        </button>
        <button class="hv-tab" [class.hv-on]="tab === 'favorites'" (click)="tab = 'favorites'">
          <span class="hv-tab-ico">&#9829;</span>
          <span>Yoqtirganlarim</span>
          <small>({{ favorites.length }})</small>
        </button>
      </div>

      <div class="hv-actions" *ngIf="tab === 'history' && history.length">
        <button class="hv-clear" (click)="askClear()">&#9851; Tozalash</button>
      </div>

      <app-skeleton-card *ngIf="loading" variant="grid" [count]="6"></app-skeleton-card>

      <ng-container *ngIf="!loading && tab === 'history'">
        <div class="hv-empty" *ngIf="!history.length">
          <div class="hv-empty-ico">&#9634;</div>
          <h4>Tarix bosh</h4>
          <p>Siz tomosha qilgan kino, serial va short dramalar shu sahifada saqlanib boriladi.</p>
        </div>

        <div class="hv-list">
          <div class="hv-item" *ngFor="let e of history">
            <div class="hv-item-main" (click)="resume(e)">
              <div class="hv-poster">
                <img [src]="posterOf(e)" [alt]="titleOf(e)" />
                <div class="hv-prog" *ngIf="percentOf(e) > 0">
                  <div class="hv-prog-in" [style.width.%]="percentOf(e)"></div>
                </div>
              </div>
              <div class="hv-info">
                <h4>{{ titleOf(e) }}</h4>
                <div class="hv-ep" *ngIf="e?.episodeNumber">{{ e?.episodeNumber }}-qism</div>
                <div class="hv-sub">
                  <span>&#9200; {{ dateOf(e) }}</span>
                  <span *ngIf="percentOf(e) > 0">&#8226; {{ percentOf(e) }}% korildi</span>
                </div>
              </div>
            </div>
            <button class="hv-play" (click)="resume(e)">&#9654; Davom etish</button>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="!loading && tab === 'favorites'">
        <div class="hv-empty" *ngIf="!favorites.length">
          <div class="hv-empty-ico">&#9825;</div>
          <h4>Sevimli kontent yoq</h4>
          <p>Siz hali hech qanday kino yoki serialni yoqtirganlar royxatiga qoshmadingiz.</p>
        </div>

        <div class="hv-grid">
          <div class="fav" *ngFor="let f of favorites" (click)="openFav(f)">
            <img class="fav-img" [src]="posterOf(f)" [alt]="titleOf(f)" />
            <div class="fav-shade"></div>
            <button class="fav-heart" (click)="unfav(f, $event)">&#9829;</button>
            <div class="fav-meta">
              <h3>{{ titleOf(f) }}</h3>
              <div class="fav-sub">
                <span *ngIf="yearOf(f)">{{ yearOf(f) }}</span>
                <span class="fav-type">{{ typeOf(f) }}</span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <div class="hv-dialog" *ngIf="confirmOpen">
        <div class="hv-dialog-card">
          <h4>Tarixni tozalash</h4>
          <p>Korish tarixini butunlay ochirmoqchimisiz? Bu amalni bekor qilib bolmaydi.</p>
          <div class="hv-dialog-row">
            <button class="hv-btn-ghost" (click)="confirmOpen = false">Bekor</button>
            <button class="hv-btn-red" (click)="doClear()">Tozalash</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hv { padding: 16px 14px 110px; background: #0f0f0f; min-height: 100dvh; }
    .hv-tabs {
      display: flex; align-items: center; gap: 16px;
      border-bottom: 1px solid rgba(39,39,42,0.9); padding-bottom: 2px;
    }
    .hv-tab {
      display: flex; align-items: center; gap: 7px; padding: 0 0 9px;
      background: none; border: none; border-bottom: 2px solid transparent;
      color: #a1a1aa; font-size: 14.5px; font-weight: 800; cursor: pointer;
      transition: all 0.2s;
    }
    .hv-tab small { font-size: 11px; font-weight: 700; }
    .hv-tab-ico { font-size: 15px; }
    .hv-on { color: #fff; border-bottom-color: #ef4444; }
    .hv-actions { display: flex; justify-content: flex-end; margin-top: 12px; }
    .hv-clear {
      padding: 7px 12px; border-radius: 12px; cursor: pointer;
      background: #18181b; border: 1px solid #27272a;
      color: #a1a1aa; font-size: 12px; font-weight: 700;
    }
    .hv-clear:active { background: rgba(69,10,10,0.8); color: #f87171; }
    .hv-list { display: flex; flex-direction: column; gap: 12px; margin-top: 14px; }
    .hv-item {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px; border-radius: 18px;
      background: rgba(24,24,27,0.85); border: 1px solid rgba(39,39,42,0.9);
    }
    .hv-item-main { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; cursor: pointer; }
    .hv-poster {
      position: relative; width: 62px; height: 82px; flex-shrink: 0;
      border-radius: 12px; overflow: hidden; background: #09090b;
    }
    .hv-poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .hv-prog { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: #27272a; }
    .hv-prog-in { height: 100%; background: #dc2626; }
    .hv-info { min-width: 0; flex: 1; }
    .hv-info h4 {
      margin: 0; font-size: 13.5px; font-weight: 800; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .hv-ep { font-size: 11.5px; color: #f87171; font-weight: 800; margin-top: 2px; }
    .hv-sub { display: flex; align-items: center; gap: 7px; margin-top: 5px; font-size: 11px; color: #a1a1aa; }
    .hv-play {
      flex-shrink: 0; padding: 9px 13px; border-radius: 12px; border: none;
      background: #dc2626; color: #fff; font-size: 11.5px; font-weight: 800;
      box-shadow: 0 6px 16px rgba(220,38,38,0.28); cursor: pointer;
    }
    .hv-grid {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px; margin-top: 16px;
    }
    .fav {
      position: relative; border-radius: 18px; overflow: hidden;
      background: #18181b; aspect-ratio: 2 / 3; cursor: pointer;
    }
    .fav-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .fav-shade {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.15) 55%, transparent);
    }
    .fav-heart {
      position: absolute; top: 8px; right: 8px;
      width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer;
      background: rgba(0,0,0,0.5); color: #ef4444; font-size: 14px;
      backdrop-filter: blur(8px);
    }
    .fav-meta { position: absolute; left: 12px; right: 12px; bottom: 12px; }
    .fav-meta h3 {
      margin: 0; font-size: 13px; font-weight: 800; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .fav-sub { display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 10px; color: #a1a1aa; }
    .fav-type { color: #f87171; font-weight: 800; text-transform: uppercase; }
    .hv-empty { text-align: center; padding: 60px 0; }
    .hv-empty-ico { font-size: 36px; color: #3f3f46; }
    .hv-empty h4 { margin: 10px 0 0; font-size: 15px; font-weight: 800; color: #d4d4d8; }
    .hv-empty p { margin: 6px auto 0; font-size: 12px; color: #71717a; max-width: 280px; line-height: 1.5; }
    .hv-dialog {
      position: fixed; inset: 0; z-index: 90; display: flex;
      align-items: center; justify-content: center; padding: 24px;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
    }
    .hv-dialog-card {
      width: 100%; max-width: 320px; padding: 20px; border-radius: 20px;
      background: #18181b; border: 1px solid #27272a;
    }
    .hv-dialog-card h4 { margin: 0; font-size: 15px; font-weight: 900; color: #fff; }
    .hv-dialog-card p { margin: 8px 0 0; font-size: 12.5px; color: #a1a1aa; line-height: 1.5; }
    .hv-dialog-row { display: flex; gap: 10px; margin-top: 16px; }
    .hv-btn-ghost {
      flex: 1; padding: 11px; border-radius: 12px; cursor: pointer;
      background: #27272a; border: none; color: #d4d4d8; font-weight: 800; font-size: 13px;
    }
    .hv-btn-red {
      flex: 1; padding: 11px; border-radius: 12px; border: none; cursor: pointer;
      background: #dc2626; color: #fff; font-weight: 800; font-size: 13px;
    }
  `],
})
export class HistoryComponent implements OnInit {
  tab: 'history' | 'favorites' = 'history';
  history: any[] = [];
  favorites: any[] = [];
  loading = true;
  confirmOpen = false;

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.api.getHistory(1).subscribe({
      next: (r: any) => { this.history = this.rows(r); this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.api.getFavorites().subscribe({
      next: (r: any) => { this.favorites = this.rows(r); },
      error: () => { this.favorites = []; },
    });
  }

  private rows(r: any): any[] {
    if (!r) { return []; }
    if (Array.isArray(r)) { return r; }
    if (Array.isArray(r.data)) { return r.data; }
    if (Array.isArray(r.items)) { return r.items; }
    return [];
  }

  private contentOf(e: any): any {
    if (!e) { return {}; }
    return e.content || e.contentItem || e;
  }

  titleOf(e: any): string {
    const c = this.contentOf(e);
    return c.title || e?.contentTitle || '';
  }

  posterOf(e: any): string {
    const c = this.contentOf(e);
    return c.posterUrl || e?.posterUrl || c.thumbnailUrl || '';
  }

  yearOf(e: any): string {
    const c = this.contentOf(e);
    return c.year ? String(c.year) : '';
  }

  typeOf(e: any): string {
    const c = this.contentOf(e);
    const map: Record<string, string> = {
      movie: 'Kino', series: 'Serial', short_drama: 'Mini drama', anime_series: 'Anime',
    };
    return c.type ? (map[c.type] || c.type) : '';
  }

  percentOf(e: any): number {
    if (!e) { return 0; }
    const dur = Number(e.durationSeconds || 0);
    const pos = Number(e.progressSeconds || 0);
    if (!dur || dur <= 0) { return 0; }
    return Math.min(100, Math.round((pos / dur) * 100));
  }

  dateOf(e: any): string {
    const raw = e?.watchedAt || e?.updatedAt || e?.createdAt;
    if (!raw) { return ''; }
    const d = new Date(raw);
    if (isNaN(d.getTime())) { return ''; }
    return d.toLocaleDateString('uz-UZ', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  private idOf(e: any): string {
    const c = this.contentOf(e);
    return e?.contentId || c.id || '';
  }

  resume(e: any): void {
    const id = this.idOf(e);
    if (id) { this.router.navigate(['/watch', id]); }
  }

  openFav(f: any): void {
    const id = this.idOf(f);
    if (id) { this.router.navigate(['/watch', id]); }
  }

  unfav(f: any, event: Event): void {
    event.stopPropagation();
    const id = this.idOf(f);
    if (!id) { return; }
    this.favorites = this.favorites.filter((x) => this.idOf(x) !== id);
    this.api.toggleFavorite(id).subscribe({ error: () => { /* noop */ } });
  }

  askClear(): void { this.confirmOpen = true; }

  doClear(): void {
    this.confirmOpen = false;
    this.history = [];
  }
}
