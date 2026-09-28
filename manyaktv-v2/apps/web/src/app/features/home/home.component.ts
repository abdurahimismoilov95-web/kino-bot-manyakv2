import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';

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
        <button class="hm-chip" [class.hm-chip-on]="activeType === null"
                (click)="setType(null)">Barchasi</button>
        <button class="hm-chip" *ngFor="let t of types"
                [class.hm-chip-on]="activeType === t.value"
                (click)="setType(t.value)">{{ t.label }}</button>
      </div>

      <section class="hm-pad" *ngIf="loadingTrending || trending.length">
        <h2 class="hm-section">Trendda</h2>
        <app-skeleton-card *ngIf="loadingTrending" variant="row" [count]="6"></app-skeleton-card>
        <div class="hm-row" *ngIf="!loadingTrending">
          <app-content-card *ngFor="let item of trending"
                            [item]="item" [hasAccess]="isVip"
                            (click)="openDetails(item)"></app-content-card>
        </div>
      </section>

      <section class="hm-pad" *ngIf="loadingNew || newItems.length">
        <h2 class="hm-section">Yangi qoshilgan</h2>
        <app-skeleton-card *ngIf="loadingNew" variant="row" [count]="6"></app-skeleton-card>
        <div class="hm-row" *ngIf="!loadingNew">
          <app-content-card *ngFor="let item of newItems"
                            [item]="item" [hasAccess]="isVip"
                            (click)="openDetails(item)"></app-content-card>
        </div>
      </section>

      <section class="hm-pad">
        <h2 class="hm-section">Barcha kinolar</h2>
        <app-skeleton-card *ngIf="loading && !content.length" variant="grid" [count]="9"></app-skeleton-card>
        <div class="hm-grid">
          <app-content-card *ngFor="let item of content"
                            [item]="item" [hasAccess]="isVip" variant="grid"
                            (click)="openDetails(item)"></app-content-card>
        </div>
        <p class="hm-empty" *ngIf="!loading && !content.length">
          Hozircha kontent yoq.
        </p>
        <button class="hm-more" *ngIf="hasMore" [disabled]="loading" (click)="loadMore()">
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
    .hm { padding-bottom: 96px; background: #0f0f0f; min-height: 100dvh; }
    .hm-pad { padding-left: 14px; padding-right: 14px; margin-top: 18px; }
    .hm-chips {
      display: flex; align-items: center; gap: 8px;
      overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;
    }
    .hm-chips::-webkit-scrollbar { display: none; }
    .hm-chip {
      flex-shrink: 0; padding: 6px 14px; border-radius: 999px;
      font-size: 13px; font-weight: 700; white-space: nowrap;
      background: rgba(24,24,27,0.8); color: #a1a1aa;
      border: 1px solid #27272a; transition: all 0.2s;
    }
    .hm-chip-on { background: #fff; color: #000; border-color: #fff; }
    .hm-section {
      font-size: 16px; font-weight: 900; color: #fff;
      margin: 0 0 10px; letter-spacing: -0.01em;
    }
    .hm-row {
      display: flex; gap: 10px; overflow-x: auto;
      padding-bottom: 6px; scrollbar-width: none;
    }
    .hm-row::-webkit-scrollbar { display: none; }
    .hm-grid {
      display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px;
    }
    @media (max-width: 380px) {
      .hm-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    .hm-empty { text-align: center; color: #71717a; font-size: 13px; padding: 28px 0; }
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
  content: any[] = [];
  selected: any = null;

  activeType: string | null = null;
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

  ngOnInit(): void {
    const u = this.storage.getUser();
    if (u) {
      this.isVip = !!u.isVip;
      this.isAdmin = u.role === 'admin' || u.role === 'super_admin';
    }
    this.loadHero();
    this.loadTrending();
    this.loadNew();
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
    this.activeType = type;
    this.loadContent(true);
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

  openPlans(): void {
    this.router.navigate(['/subscription']);
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
