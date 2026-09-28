import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';

/** manyak-tv1 HomeView.tsx dizayni */
@Component({
  selector: 'app-home',
  template: `
    <app-header [isAdmin]="isAdmin"></app-header>

    <div class="hm">
      <app-hero-slider
        [items]="heroItems"
        (play)="openWatch($event)"
        (details)="openDetails($event)">
      </app-hero-slider>

      <div class="hm-pad">
        <app-daily-checkin [isVip]="isVip" (openVip)="openPlans()"></app-daily-checkin>
      </div>

      <div class="hm-pad hm-chips">
        <button class="hm-chip" [class.hm-chip-on]="activeType === null && !showNewOnly"
                (click)="setType(null)">Barchasi</button>

        <button class="hm-chip hm-chip-new" *ngIf="newItems.length"
                [class.hm-chip-new-on]="showNewOnly"
                (click)="toggleNew()">
          &#10022; Yangi kinolar ({{ newItems.length }})
        </button>

        <button class="hm-chip" *ngFor="let t of types"
                [class.hm-chip-on]="activeType === t.value && !showNewOnly"
                (click)="setType(t.value)">{{ t.label }}</button>
      </div>

      <div class="hm-pad" *ngIf="!isVip">
        <div class="vip-banner" (click)="openPlans()">
          <div class="vip-glow"></div>
          <div class="vip-left">
            <div class="vip-ico">&#10022;</div>
            <div>
              <h4 class="vip-title">VIP obuna</h4>
              <p class="vip-sub">Barcha premium kinolar cheksiz</p>
            </div>
          </div>
          <span class="vip-arrow">&#8250;</span>
        </div>
      </div>

      <section class="hm-pad" *ngIf="!showNewOnly && (loadingTrending || trending.length)">
        <div class="hm-head">
          <h2 class="hm-section">&#128293; Trendda</h2>
        </div>
        <app-skeleton-card *ngIf="loadingTrending" variant="row" [count]="6"></app-skeleton-card>
        <div class="hm-row" *ngIf="!loadingTrending">
          <app-content-card *ngFor="let item of trending"
                            [item]="item" [hasAccess]="isVip"
                            (click)="openDetails(item)"></app-content-card>
        </div>
      </section>

      <section class="hm-pad" *ngIf="!showNewOnly && (loadingNew || newItems.length)">
        <div class="hm-head">
          <h2 class="hm-section">&#10022; Yangi qoshilgan</h2>
        </div>
        <app-skeleton-card *ngIf="loadingNew" variant="row" [count]="6"></app-skeleton-card>
        <div class="hm-row" *ngIf="!loadingNew">
          <app-content-card *ngFor="let item of newItems"
                            [item]="item" [hasAccess]="isVip"
                            (click)="openDetails(item)"></app-content-card>
        </div>
      </section>

      <section class="hm-pad" *ngIf="!showNewOnly && shorts.length">
        <div class="hm-head">
          <h2 class="hm-section">&#9654; Mini dramalar</h2>
          <button class="hm-all" (click)="goShorts()">Barchasi &#8250;</button>
        </div>
        <div class="hm-row">
          <div class="sd" *ngFor="let item of shorts" (click)="goShorts()">
            <img class="sd-img" [src]="posterOf(item)" [alt]="item?.title || ''" />
            <div class="sd-shade"></div>
            <span class="sd-hot">HOT</span>
            <div class="sd-meta">
              <h5 class="sd-title">{{ item?.title }}</h5>
              <span class="sd-eps" *ngIf="item?.episodeCount">{{ item?.episodeCount }} qism</span>
            </div>
          </div>
        </div>
      </section>

      <section class="hm-pad">
        <div class="hm-head">
          <h2 class="hm-section">{{ gridTitle }}</h2>
        </div>
        <app-skeleton-card *ngIf="loading && !gridItems.length" variant="grid" [count]="9"></app-skeleton-card>
        <div class="hm-grid">
          <app-content-card *ngFor="let item of gridItems"
                            [item]="item" [hasAccess]="isVip" variant="grid"
                            (click)="openDetails(item)"></app-content-card>
        </div>
        <div class="hm-empty" *ngIf="!loading && !gridItems.length">
          <div class="hm-empty-ico">&#9634;</div>
          <h4>Hozircha kontent yoq</h4>
          <p>Tez orada yangi kinolar qoshiladi.</p>
        </div>
        <button class="hm-more" *ngIf="hasMore && !showNewOnly" [disabled]="loading" (click)="loadMore()">
          {{ loading ? 'Yuklanmoqda...' : 'Yana korsatish' }}
        </button>
      </section>
    </div>

    <app-content-details
      [item]="selected"
      (close)="selected = null"
      (play)="openWatch($event)"
      (favorite)="toggleFav($event)">
    </app-content-details>
  `,
  styles: [`
    .hm { padding-bottom: 110px; background: #0f0f0f; min-height: 100dvh; }
    .hm-pad { padding-left: 14px; padding-right: 14px; margin-top: 20px; }
    .hm-chips {
      display: flex; align-items: center; gap: 8px;
      overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;
    }
    .hm-chips::-webkit-scrollbar { display: none; }
    .hm-chip {
      flex-shrink: 0; padding: 6px 14px; border-radius: 999px;
      font-size: 13px; font-weight: 700; white-space: nowrap;
      background: rgba(24,24,27,0.85); color: #a1a1aa;
      border: 1px solid #27272a; transition: all 0.2s; cursor: pointer;
    }
    .hm-chip-on { background: #fff; color: #000; border-color: #fff; box-shadow: 0 4px 14px rgba(255,255,255,0.14); }
    .hm-chip-new-on {
      background: linear-gradient(90deg, #10b981, #16a34a);
      color: #fff; border-color: transparent;
      box-shadow: 0 6px 16px rgba(16,185,129,0.35);
    }
    .vip-banner {
      position: relative; overflow: hidden; cursor: pointer;
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px; border-radius: 18px;
      background: linear-gradient(90deg, rgba(69,10,10,0.85), #18181b 60%, #18181b);
      border: 1px solid rgba(153,27,27,0.65);
      box-shadow: 0 10px 26px rgba(0,0,0,0.45);
    }
    .vip-glow {
      position: absolute; right: -40px; top: -40px; width: 160px; height: 160px;
      background: radial-gradient(circle, rgba(220,38,38,0.35), transparent 70%);
    }
    .vip-left { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }
    .vip-ico {
      width: 40px; height: 40px; border-radius: 12px; background: #dc2626;
      display: flex; align-items: center; justify-content: center;
      color: #fcd34d; font-size: 18px; box-shadow: 0 8px 20px rgba(220,38,38,0.4);
    }
    .vip-title { margin: 0; font-size: 14px; font-weight: 900; color: #fff; }
    .vip-sub { margin: 2px 0 0; font-size: 11.5px; color: #a1a1aa; }
    .vip-arrow { position: relative; z-index: 1; color: #f87171; font-size: 22px; font-weight: 700; }
    .hm-head {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 10px;
    }
    .hm-section {
      font-size: 16px; font-weight: 900; color: #fff;
      margin: 0; letter-spacing: -0.01em;
    }
    .hm-all { background: none; border: none; color: #a1a1aa; font-size: 12px; font-weight: 700; cursor: pointer; }
    .hm-row {
      display: flex; gap: 10px; overflow-x: auto;
      padding-bottom: 6px; scrollbar-width: none;
    }
    .hm-row::-webkit-scrollbar { display: none; }
    .sd {
      position: relative; flex-shrink: 0; width: 118px; aspect-ratio: 9 / 16;
      border-radius: 14px; overflow: hidden; background: #18181b;
      border: 1px solid rgba(63,63,70,0.55); cursor: pointer;
    }
    .sd-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .sd-shade {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.9), transparent 55%);
    }
    .sd-hot {
      position: absolute; top: 6px; left: 6px; font-size: 9px; font-weight: 900;
      background: #dc2626; color: #fff; padding: 2px 6px; border-radius: 6px;
    }
    .sd-meta { position: absolute; left: 8px; right: 8px; bottom: 8px; }
    .sd-title {
      margin: 0; font-size: 11.5px; font-weight: 800; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sd-eps { font-size: 10px; color: #d4d4d8; }
    .hm-grid {
      display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;
    }
    @media (max-width: 360px) {
      .hm-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    .hm-empty { text-align: center; padding: 44px 0; }
    .hm-empty-ico { font-size: 34px; color: #3f3f46; }
    .hm-empty h4 { margin: 10px 0 0; font-size: 14px; color: #d4d4d8; font-weight: 800; }
    .hm-empty p { margin: 4px 0 0; font-size: 12px; color: #71717a; }
    .hm-more {
      width: 100%; margin-top: 16px; padding: 12px; border-radius: 12px;
      background: rgba(39,39,42,0.9); color: #e4e4e7;
      border: 1px solid rgba(63,63,70,0.7); font-size: 13px; font-weight: 700;
    }
  `],
})
export class HomeComponent implements OnInit {
  heroItems: any[] = [];
  trending: any[] = [];
  newItems: any[] = [];
  shorts: any[] = [];
  content: any[] = [];
  selected: any = null;

  activeType: string | null = null;
  showNewOnly = false;
  page = 1;
  hasMore = false;
  loading = false;
  loadingTrending = true;
  loadingNew = true;

  isVip = false;
  isAdmin = false;

  types = [
    { label: 'Kinolar', value: 'movie' },
    { label: 'Seriallar', value: 'series' },
    { label: 'Anime', value: 'anime_series' },
    { label: 'Mini drama', value: 'short_drama' },
  ];

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly storage: StorageService,
  ) {}

  get gridItems(): any[] {
    return this.showNewOnly ? this.newItems : this.content;
  }

  get gridTitle(): string {
    if (this.showNewOnly) { return 'Yangi kinolar'; }
    if (!this.activeType) { return 'Barcha kinolar'; }
    const found = this.types.find((t) => t.value === this.activeType);
    return found ? found.label : 'Barcha kinolar';
  }

  ngOnInit(): void {
    const u = this.storage.getUser();
    if (u) {
      this.isVip = !!u.isVip;
      this.isAdmin = u.role === 'admin' || u.role === 'super_admin';
    }
    this.loadHero();
    this.loadTrending();
    this.loadNew();
    this.loadShorts();
    this.loadContent(true);
  }

  private loadHero(): void {
    this.api.getFeatured().subscribe({
      next: (r: any) => { this.heroItems = this.rows(r).slice(0, 5); },
      error: () => { this.heroItems = []; },
    });
  }

  private loadTrending(): void {
    this.api.getTrending().subscribe({
      next: (r: any) => { this.trending = this.rows(r); this.loadingTrending = false; },
      error: () => { this.loadingTrending = false; },
    });
  }

  private loadNew(): void {
    this.api.getContent({ page: 1, limit: 12 }).subscribe({
      next: (r: any) => { this.newItems = this.rows(r); this.loadingNew = false; },
      error: () => { this.loadingNew = false; },
    });
  }

  private loadShorts(): void {
    this.api.getContent({ page: 1, limit: 12, type: 'short_drama' }).subscribe({
      next: (r: any) => { this.shorts = this.rows(r); },
      error: () => { this.shorts = []; },
    });
  }

  loadContent(reset = false): void {
    if (this.loading) { return; }
    this.loading = true;
    if (reset) { this.page = 1; }
    this.api.getContent({ page: this.page, limit: 21, type: this.activeType }).subscribe({
      next: (r: any) => {
        const items = this.rows(r);
        this.content = reset ? items : this.content.concat(items);
        const total = r && r.totalPages ? r.totalPages : 1;
        this.hasMore = this.page < total;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  setType(type: string | null): void {
    this.showNewOnly = false;
    this.activeType = type;
    this.loadContent(true);
  }

  toggleNew(): void {
    this.showNewOnly = !this.showNewOnly;
  }

  loadMore(): void {
    this.page = this.page + 1;
    this.loadContent();
  }

  openDetails(item: any): void {
    if (!item) { return; }
    this.selected = item;
  }

  openWatch(item: any): void {
    if (!item) { return; }
    this.selected = null;
    this.router.navigate(['/watch', item.id]);
  }

  openPlans(): void { this.router.navigate(['/subscription']); }

  goShorts(): void { this.router.navigate(['/shorts']); }

  posterOf(item: any): string {
    if (!item) { return ''; }
    return item.posterUrl || item.thumbnailUrl || '';
  }

  toggleFav(item: any): void {
    if (!item) { return; }
    this.api.toggleFavorite(item.id).subscribe({ error: () => { /* noop */ } });
  }

  private rows(r: any): any[] {
    if (!r) { return []; }
    if (Array.isArray(r)) { return r; }
    if (Array.isArray(r.data)) { return r.data; }
    if (Array.isArray(r.items)) { return r.items; }
    return [];
  }
}
