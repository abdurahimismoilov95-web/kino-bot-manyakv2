import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';
import { environment } from '../../../environments/environment';

/** Bosh sahifa: faqat 4 bolim - Mini drama, Kino, Serial, Anime */
@Component({
  selector: 'app-home',
  template: `
    <app-header [isAdmin]="isAdmin"></app-header>

    <div class="hm">
      <app-hero-slider
        [items]="heroItems"
        (play)="openWatch($event)"
        (details)="openWatch($event)">
      </app-hero-slider>

      <div class="hm-pad" *ngIf="isAdmin">
        <div class="adm" (click)="goAdmin()">
          <div class="adm-l">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/></svg>
            <div>
              <div class="adm-row">
                <h4>Admin Boshqaruv Paneli</h4>
                <span class="adm-badge">FAOL</span>
              </div>
              <p>Kino yuklash, tolov cheklari, foydalanuvchilar va kataloglar</p>
            </div>
          </div>
          <button class="adm-btn" (click)="goAdmin()">Kirish</button>
        </div>
      </div>

      <div class="hm-pad hm-chips">
        <button class="hm-chip" [class.hm-chip-on]="activeType === null"
                (click)="setType(null)">Barchasi</button>
        <button class="hm-chip" *ngFor="let s of sections"
                [class.hm-chip-on]="activeType === s.type"
                (click)="setType(s.type)">{{ s.label }}</button>
      </div>

      <div class="hm-pad" *ngIf="!isVip">
        <div class="vip-banner" (click)="openPlans()">
          <div class="vip-glow"></div>
          <div class="vip-left">
            <div class="vip-ico">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fcd34d"><path d="M3 18h18l1-11-5 4-5-7-5 7-5-4z"/></svg>
            </div>
            <div>
              <h4 class="vip-title">VIP obuna</h4>
              <p class="vip-sub">Barcha premium kinolar cheksiz</p>
            </div>
          </div>
          <span class="vip-arrow">&#8250;</span>
        </div>
      </div>

      <ng-container *ngIf="activeType === null">
        <ng-container *ngFor="let s of sections">
          <section class="hm-pad" *ngIf="s.loading || s.items.length">
            <div class="hm-head">
              <h2 class="hm-section">{{ s.label }}</h2>
              <button class="hm-all" (click)="s.type === 'short_drama' ? goShorts() : setType(s.type)">Barchasi &#8250;</button>
            </div>
            <app-skeleton-card *ngIf="s.loading" variant="row" [count]="6"></app-skeleton-card>

            <div class="hm-row" *ngIf="!s.loading && s.type === 'short_drama'">
              <div class="sd" *ngFor="let item of s.items" (click)="openWatch(item)">
                <img class="sd-img" [src]="posterOf(item)" [alt]="item?.title || ''" />
                <div class="sd-shade"></div>
                <span class="sd-hot">HOT</span>
                <div class="sd-meta">
                  <h5 class="sd-title">{{ item?.title }}</h5>
                  <span class="sd-eps" *ngIf="item?.episodeCount">{{ item?.episodeCount }} qism</span>
                </div>
              </div>
            </div>

            <div class="hm-row" *ngIf="!s.loading && s.type !== 'short_drama'">
              <app-content-card *ngFor="let item of s.items"
                                [item]="item" [hasAccess]="isVip"
                                (click)="openWatch(item)"></app-content-card>
            </div>
          </section>
        </ng-container>

        <div class="hm-empty" *ngIf="allEmpty">
          <div class="hm-empty-ico">&#9634;</div>
          <h4>Hozircha kontent yoq</h4>
          <p>Tez orada yangi kinolar qoshiladi.</p>
        </div>
      </ng-container>

      <section class="hm-pad" *ngIf="activeType !== null">
        <div class="hm-head">
          <h2 class="hm-section">{{ gridTitle }}</h2>
        </div>
        <app-skeleton-card *ngIf="loading && !content.length" variant="grid" [count]="9"></app-skeleton-card>
        <div class="hm-grid">
          <app-content-card *ngFor="let item of content"
                            [item]="item" [hasAccess]="isVip" variant="grid"
                            (click)="openWatch(item)"></app-content-card>
        </div>
        <div class="hm-empty" *ngIf="!loading && !content.length">
          <div class="hm-empty-ico">&#9634;</div>
          <h4>Hozircha kontent yoq</h4>
          <p>Tez orada yangi kinolar qoshiladi.</p>
        </div>
        <button class="hm-more" *ngIf="hasMore" [disabled]="loading" (click)="loadMore()">
          {{ loading ? 'Yuklanmoqda...' : 'Yana korsatish' }}
        </button>
      </section>
    </div>

    <app-store-showcase
      [items]="storeItems"
      [hasAccess]="isVip"
      (select)="openWatch($event)"
      (buy)="buyItem($event)">
    </app-store-showcase>
  `,
  styles: [`
    .hm { padding-bottom: 110px; background: #0f0f0f; min-height: 100dvh; }
    .hm-pad { padding-left: 14px; padding-right: 14px; margin-top: 20px; }
    .adm {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 14px; border-radius: 18px; cursor: pointer;
      background: rgba(69,10,10,0.45); border: 1px solid rgba(153,27,27,0.85);
      box-shadow: 0 10px 24px rgba(0,0,0,0.4);
    }
    .adm-l { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .adm-row { display: flex; align-items: center; gap: 6px; }
    .adm-row h4 { margin: 0; font-size: 12.5px; font-weight: 900; color: #fff; }
    .adm-badge {
      font-size: 9px; font-weight: 900; background: #dc2626; color: #fff;
      padding: 1px 5px; border-radius: 4px;
    }
    .adm p { margin: 3px 0 0; font-size: 11px; color: #a1a1aa; }
    .adm-btn {
      flex-shrink: 0; padding: 9px 15px; border-radius: 12px; border: none; cursor: pointer;
      background: #dc2626; color: #fff; font-size: 12px; font-weight: 800;
      box-shadow: 0 6px 16px rgba(220,38,38,0.3);
    }
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
      box-shadow: 0 8px 20px rgba(220,38,38,0.4);
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
  content: any[] = [];
  storeItems: any[] = [];

  sections: Array<{ type: string; label: string; items: any[]; loading: boolean }> = [
    { type: 'short_drama', label: 'Mini drama', items: [], loading: true },
    { type: 'movie', label: 'Kino', items: [], loading: true },
    { type: 'series', label: 'Serial', items: [], loading: true },
    { type: 'anime_series', label: 'Anime', items: [], loading: true },
  ];

  activeType: string | null = null;
  page = 1;
  hasMore = false;
  loading = false;

  isVip = false;
  isAdmin = false;

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly storage: StorageService,
  ) {}

  get gridTitle(): string {
    const found = this.sections.find((s) => s.type === this.activeType);
    return found ? found.label : '';
  }

  get allEmpty(): boolean {
    return this.sections.every((s) => !s.loading && s.items.length === 0);
  }

  ngOnInit(): void {
    const u = this.storage.getUser();
    if (u) {
      this.isVip = !!u.isVip;
      this.isAdmin = u.role === 'admin' || u.role === 'super_admin' || !!u.isAdmin;
    }
    this.loadHero();
    this.sections.forEach((s) => this.loadSection(s));
  }

  private loadHero(): void {
    this.api.getFeatured().subscribe({
      next: (r: any) => { this.heroItems = this.rows(r).slice(0, 5); },
      error: () => { this.heroItems = []; },
    });
  }

  private loadSection(s: { type: string; items: any[]; loading: boolean }): void {
    this.api.getContent({ page: 1, limit: 12, type: s.type }).subscribe({
      next: (r: any) => { s.items = this.rows(r); s.loading = false; this.buildStore(); },
      error: () => { s.loading = false; },
    });
  }

  loadContent(reset = false): void {
    if (this.loading || !this.activeType) { return; }
    this.loading = true;
    if (reset) { this.page = 1; this.content = []; }
    this.api.getContent({ page: this.page, limit: 21, type: this.activeType }).subscribe({
      next: (r: any) => {
        const items = this.rows(r);
        this.content = reset ? items : this.content.concat(items);
        const total = r && r.totalPages ? r.totalPages : 1;
        this.hasMore = this.page < total;
        this.loading = false;
        this.buildStore();
      },
      error: () => { this.loading = false; },
    });
  }

  /** v1: featuredStoreItems = isSinglePurchase || isFeaturedStore (isFeaturedStore birinchi) */
  private buildStore(): void {
    let all: any[] = this.content.slice();
    this.sections.forEach((s) => { all = all.concat(s.items); });
    const seen: Record<string, boolean> = {};
    const picked: any[] = [];
    all.forEach((c) => {
      if (!c || !c.id || seen[c.id]) { return; }
      if (c.isSinglePurchase || c.isFeaturedStore) {
        seen[c.id] = true;
        picked.push(c);
      }
    });
    picked.sort((a, b) => {
      if (a.isFeaturedStore && !b.isFeaturedStore) { return -1; }
      if (!a.isFeaturedStore && b.isFeaturedStore) { return 1; }
      return 0;
    });
    this.storeItems = picked;
  }

  setType(type: string | null): void {
    this.activeType = type;
    if (type) { this.loadContent(true); }
  }

  loadMore(): void {
    this.page = this.page + 1;
    this.loadContent();
  }

  openWatch(item: any): void {
    if (!item || !item.id) { return; }
    this.router.navigate(['/watch', item.id]);
  }

  openPlans(): void { this.router.navigate(['/subscription']); }

  buyItem(item: any): void {
    if (!item || !item.id) { this.openPlans(); return; }
    this.router.navigate(['/subscription'], {
      queryParams: {
        contentId: item.id,
        title: item.title || '',
        price: Number(item.price || 15000),
      },
    });
  }

  goShorts(): void { this.router.navigate(['/shorts']); }

  goAdmin(): void { this.router.navigate(['/admin']); }

  posterOf(item: any): string {
    if (!item) { return ''; }
    const u: string = item.posterUrl || item.thumbnailUrl || '';
    if (!u) { return ''; }
    if (/^(https?:|data:|blob:)/i.test(u)) { return u; }
    const origin = String(environment.apiUrl || '').replace(/\/api\/v\d+\/?$/, '').replace(/\/+$/, '');
    return origin + (u.charAt(0) === '/' ? u : '/' + u);
  }

  private rows(r: any): any[] {
    if (!r) { return []; }
    if (Array.isArray(r)) { return r; }
    if (Array.isArray(r.data)) { return r.data; }
    if (Array.isArray(r.items)) { return r.items; }
    return [];
  }
}
