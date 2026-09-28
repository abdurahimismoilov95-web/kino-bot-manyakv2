import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-home',
  template: `
    <div class="home-page pb-20">
      <!-- Hero / Featured Slider -->
      <section class="hero-slider relative" *ngIf="featured.length > 0">
        <div
          class="hero-slide"
          [style.background-image]="'url(' + featured[activeSlide]?.bannerUrl + ')'"
        >
          <div class="hero-overlay">
            <h1 class="text-2xl font-bold text-white">{{ featured[activeSlide]?.title }}</h1>
            <p class="text-sm text-gray-300 mt-1">
              {{ featured[activeSlide]?.year }} &bull; {{ featured[activeSlide]?.duration }}
            </p>
            <div class="flex gap-2 mt-4">
              <button class="btn-primary" (click)="openContent(featured[activeSlide])">
                &#9654; Korish
              </button>
              <button class="btn-secondary" (click)="toggleFav(featured[activeSlide])">
                &#10084; Sevimli
              </button>
            </div>
          </div>
        </div>
        <div class="hero-dots">
          <span
            *ngFor="let f of featured; let i = index"
            [class.active]="i === activeSlide"
            (click)="activeSlide = i"
          ></span>
        </div>
      </section>

      <!-- Trending -->
      <section class="px-4 mt-6" *ngIf="trending.length > 0">
        <h2 class="section-title">&#128293; Trend</h2>
        <div class="content-row">
          <div class="content-card" *ngFor="let item of trending" (click)="openContent(item)">
            <img
              [src]="item.posterUrl || 'assets/no-poster.png'"
              [alt]="item.title"
              loading="lazy"
            />
            <div class="content-card-info">
              <p class="title">{{ item.title }}</p>
              <span class="badge" [class.vip-badge]="item.isPremium">{{
                item.isPremium ? 'VIP' : 'Bepul'
              }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- All Content -->
      <section class="px-4 mt-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="section-title">Barcha filmlar</h2>
          <div class="flex gap-2">
            <button
              *ngFor="let t of types"
              class="chip"
              [class.active]="activeType === t.value"
              (click)="setType(t.value)"
            >
              {{ t.label }}
            </button>
          </div>
        </div>
        <div class="content-grid">
          <div class="content-card" *ngFor="let item of content" (click)="openContent(item)">
            <img
              [src]="item.posterUrl || 'assets/no-poster.png'"
              [alt]="item.title"
              loading="lazy"
            />
            <div class="content-card-info">
              <p class="title">{{ item.title }}</p>
              <div class="flex items-center gap-1">
                <span class="badge" [class.vip-badge]="item.isPremium">{{
                  item.isPremium ? 'VIP' : 'Bepul'
                }}</span>
                <span class="text-xs text-gray-400">{{ item.year }}</span>
              </div>
            </div>
          </div>
        </div>
        <button *ngIf="hasMore" class="load-more-btn" (click)="loadMore()" [disabled]="loading">
          {{ loading ? 'Yuklanmoqda...' : 'Koproq korsatish' }}
        </button>
      </section>
    </div>
  `,
})
export class HomeComponent implements OnInit, OnDestroy {
  featured: any[] = [];
  trending: any[] = [];
  content: any[] = [];
  activeSlide = 0;
  activeType: string | null = null;
  private slideTimer: any;
  page = 1;
  hasMore = false;
  loading = false;

  types: Array<{ label: string; value: string | null }> = [
    { label: 'Barchasi', value: null },
    { label: 'Filmlar', value: 'movie' },
    { label: 'Seriallar', value: 'series' },
    { label: 'Anime', value: 'anime_series' },
  ];

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadFeatured();
    this.loadTrending();
    this.loadContent();
    this.slideTimer = setInterval(() => {
      if (this.featured.length > 1)
        this.activeSlide = (this.activeSlide + 1) % this.featured.length;
    }, 5000);
  }

  ngOnDestroy() {
    clearInterval(this.slideTimer);
  }

  loadFeatured() {
    this.api.getFeatured().subscribe({ next: (r: any) => (this.featured = r || []) });
  }

  loadTrending() {
    this.api.getTrending().subscribe({ next: (r: any) => (this.trending = r || []) });
  }

  loadContent(reset = false) {
    if (this.loading) return;
    this.loading = true;
    this.api.getContent({ page: this.page, limit: 20, type: this.activeType }).subscribe({
      next: (r: any) => {
        this.content = reset ? r.data : [...this.content, ...r.data];
        this.hasMore = this.page < r.totalPages;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  setType(type: string | null) {
    this.activeType = type;
    this.page = 1;
    this.loadContent(true);
  }

  loadMore() {
    this.page++;
    this.loadContent();
  }

  openContent(item: any) {
    if (!item) return;
    this.router.navigate(['/watch', item.id]);
  }

  toggleFav(item: any) {
    if (!item) return;
    this.api.toggleFavorite(item.id).subscribe();
  }
}
