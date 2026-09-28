import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';

/** manyak-tv1 SearchView.tsx dizayni */
@Component({
  selector: 'app-search',
  template: `
    <div class="sv">
      <div class="sv-input">
        <span class="sv-ico">&#9906;</span>
        <input type="text" [(ngModel)]="query"
               placeholder="Kino, serial yoki drama qidirish..." />
        <button class="sv-clear" *ngIf="query" (click)="query = ''">&#10005;</button>
      </div>

      <div class="sv-chips">
        <button class="sv-chip" [class.sv-on]="type === 'all'" (click)="setType('all')">Barchasi</button>
        <button class="sv-chip" [class.sv-on]="type === 'movie'" (click)="setType('movie')">Kinolar</button>
        <button class="sv-chip" [class.sv-on]="type === 'series'" (click)="setType('series')">Seriallar</button>
        <button class="sv-chip" [class.sv-on]="type === 'anime_series'" (click)="setType('anime_series')">Anime</button>
        <button class="sv-chip" [class.sv-on]="type === 'short_drama'" (click)="setType('short_drama')">Short Dramalar</button>
        <button class="sv-chip sv-free" [class.sv-free-on]="onlyFree" (click)="onlyFree = !onlyFree">
          &#9878; Faqat bepullar
        </button>
      </div>

      <div class="sv-count">
        Natijalar: <b>{{ filtered.length }}</b> ta kontent
      </div>

      <app-skeleton-card *ngIf="loading" variant="grid" [count]="9"></app-skeleton-card>

      <div class="sv-empty" *ngIf="!loading && !filtered.length">
        <div class="sv-empty-ico">&#9634;</div>
        <h4>Hech qanday film topilmadi</h4>
        <p>Boshqa soz bilan qidirib koring</p>
      </div>

      <div class="sv-grid" *ngIf="!loading && filtered.length">
        <app-content-card *ngFor="let item of filtered"
                          [item]="item" [hasAccess]="isVip" variant="grid"
                          (click)="open(item)"></app-content-card>
      </div>
    </div>
  `,
  styles: [`
    .sv { padding: 16px 14px 110px; background: #0f0f0f; min-height: 100dvh; }
    .sv-input { position: relative; }
    .sv-input input {
      width: 100%; background: rgba(24,24,27,0.92);
      border: 1px solid rgba(63,63,70,0.8); border-radius: 16px;
      padding: 13px 40px 13px 38px; font-size: 13.5px; color: #fff;
      outline: none; box-shadow: 0 8px 22px rgba(0,0,0,0.4);
      transition: border-color 0.2s;
    }
    .sv-input input::placeholder { color: #71717a; }
    .sv-input input:focus { border-color: #dc2626; }
    .sv-ico {
      position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
      color: #a1a1aa; font-size: 14px;
    }
    .sv-clear {
      position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
      width: 22px; height: 22px; border-radius: 50%; border: none;
      background: #27272a; color: #a1a1aa; font-size: 11px; cursor: pointer;
    }
    .sv-chips {
      display: flex; align-items: center; gap: 8px; margin-top: 14px;
      overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;
    }
    .sv-chips::-webkit-scrollbar { display: none; }
    .sv-chip {
      flex-shrink: 0; padding: 7px 13px; border-radius: 12px;
      font-size: 12px; font-weight: 800; white-space: nowrap; cursor: pointer;
      background: #18181b; color: #a1a1aa; border: 1px solid #27272a;
      transition: all 0.2s;
    }
    .sv-on { background: #dc2626; color: #fff; border-color: transparent; }
    .sv-free-on { background: #059669; color: #fff; border-color: transparent; }
    .sv-count { margin-top: 14px; font-size: 12px; color: #a1a1aa; }
    .sv-count b { color: #fff; }
    .sv-grid {
      display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px; margin-top: 14px;
    }
    @media (max-width: 360px) { .sv-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .sv-empty { text-align: center; padding: 60px 0; }
    .sv-empty-ico { font-size: 34px; color: #3f3f46; }
    .sv-empty h4 { margin: 10px 0 0; font-size: 14px; font-weight: 800; color: #d4d4d8; }
    .sv-empty p { margin: 4px 0 0; font-size: 12px; color: #71717a; }
  `],
})
export class SearchComponent implements OnInit {
  query = '';
  type: string = 'all';
  onlyFree = false;
  loading = true;
  isVip = false;
  all: any[] = [];

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly storage: StorageService,
  ) {}

  get filtered(): any[] {
    const q = this.query.trim().toLowerCase();
    return this.all.filter((item) => {
      if (this.type !== 'all' && item.type !== this.type) { return false; }
      if (this.onlyFree && (item.isPremium || item.isVipOnly)) { return false; }
      if (!q) { return true; }
      const title = (item.title || '').toLowerCase();
      const orig = (item.originalTitle || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const genres: string[] = Array.isArray(item.genres) ? item.genres : [];
      return (
        title.indexOf(q) >= 0 ||
        orig.indexOf(q) >= 0 ||
        desc.indexOf(q) >= 0 ||
        genres.some((g) => (g || '').toLowerCase().indexOf(q) >= 0)
      );
    });
  }

  ngOnInit(): void {
    const u = this.storage.getUser();
    if (u) { this.isVip = !!u.isVip; }
    this.api.getContent({ page: 1, limit: 100 }).subscribe({
      next: (r: any) => {
        this.all = Array.isArray(r) ? r : (r && Array.isArray(r.data) ? r.data : []);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  setType(t: string): void { this.type = t; }

  open(item: any): void {
    if (!item) { return; }
    this.router.navigate(['/watch', item.id]);
  }
}
