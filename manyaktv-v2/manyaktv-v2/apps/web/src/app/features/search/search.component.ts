import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-search',
  template: `
    <div class="search-page pb-20 px-4">
      <div class="search-bar-wrap pt-4 pb-3 sticky top-0 bg-[var(--bg-primary)] z-10">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">&#128269;</span>
          <input
            class="search-input w-full bg-[var(--bg-secondary)] rounded-xl pl-10 pr-4 py-3 text-sm outline-none"
            type="text"
            placeholder="Kino, serial, anime..."
            [(ngModel)]="query"
            (ngModelChange)="onSearch($event)"
          />
          <button *ngIf="query" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" (click)="clear()">&#10005;</button>
        </div>
        <!-- Genre filter -->
        <div class="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
          <button *ngFor="let g of genres"
            class="chip whitespace-nowrap"
            [class.active]="activeGenre === g"
            (click)="setGenre(g)">
            {{ g }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-8 text-gray-400">Qidirilmoqda...</div>

      <!-- Results -->
      <div class="content-grid" *ngIf="!loading && results.length > 0">
        <div class="content-card" *ngFor="let item of results" (click)="open(item)">
          <img [src]="item.posterUrl || 'assets/no-poster.png'" [alt]="item.title" loading="lazy" />
          <div class="content-card-info">
            <p class="title">{{ item.title }}</p>
            <div class="flex gap-1 items-center">
              <span class="badge" [class.vip-badge]="item.isPremium">{{ item.isPremium ? 'VIP' : 'Bepul' }}</span>
              <span class="text-xs text-gray-400">{{ item.year }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && results.length === 0 && query" class="text-center py-16">
        <p class="text-4xl mb-3">&#128247;</p>
        <p class="text-gray-400">"{{ query }}" bo'yicha natija topilmadi</p>
      </div>

      <!-- Default (no query) -->
      <div *ngIf="!query" class="text-center py-16">
        <p class="text-4xl mb-3">&#128269;</p>
        <p class="text-gray-400">Kino yoki serial nomini kiriting</p>
      </div>
    </div>
  `,
})
export class SearchComponent {
  query = '';
  results: any[] = [];
  loading = false;
  activeGenre = 'Barchasi';

  genres = ['Barchasi', 'Drama', 'Komediya', 'Triller', 'Jangovar', 'Romantik', 'Animatsiya', 'Qo\'rqinch', 'Fantastika'];

  private searchSubject = new Subject<string>();

  constructor(private api: ApiService, private router: Router) {
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((q) => {
          this.loading = true;
          const genre = this.activeGenre !== 'Barchasi' ? this.activeGenre : undefined;
          return this.api.getContent({ search: q, genre, limit: 40, page: 1 });
        }),
      )
      .subscribe({
        next: (r: any) => { this.results = r.data; this.loading = false; },
        error: () => (this.loading = false),
      });
  }

  onSearch(q: string) { if (q.trim()) this.searchSubject.next(q.trim()); else this.results = []; }
  clear() { this.query = ''; this.results = []; }
  setGenre(g: string) { this.activeGenre = g; if (this.query) this.onSearch(this.query); }
  open(item: any) { this.router.navigate(['/watch', item.id]); }
}
