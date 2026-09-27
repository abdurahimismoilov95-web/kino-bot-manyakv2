import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-favorites',
  template: `
    <div class="favorites-page pb-20 px-4">
      <h1 class="page-title pt-5 mb-4">&#10084; Sevimlilar</h1>

      <div *ngIf="loading" class="text-center py-10 text-gray-400">Yuklanmoqda...</div>

      <div *ngIf="!loading && items.length === 0" class="text-center py-16">
        <p class="text-4xl mb-3">&#10084;</p>
        <p class="text-gray-400">Hali hech narsa sevimlilarga qo'shilmagan</p>
        <p class="text-xs text-gray-500 mt-2">Kino ochib, yurak tugmasini bosing</p>
      </div>

      <div class="content-grid" *ngIf="!loading && items.length > 0">
        <div class="content-card" *ngFor="let item of items">
          <img [src]="item.content?.posterUrl || 'assets/no-poster.png'"
               [alt]="item.content?.title" loading="lazy"
               (click)="open(item)" />
          <div class="content-card-info">
            <p class="title" (click)="open(item)">{{ item.content?.title }}</p>
            <div class="flex items-center justify-between">
              <span class="badge" [class.vip-badge]="item.content?.isPremium">
                {{ item.content?.isPremium ? 'VIP' : 'Bepul' }}
              </span>
              <button class="text-red-400 text-sm" (click)="remove(item)">&#128465;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-title { font-size: 1.25rem; font-weight: 700; }
  `]
})
export class FavoritesComponent implements OnInit {
  items: any[] = [];
  loading = true;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getFavorites().subscribe({
      next: (r: any) => { this.items = r.data; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  open(item: any) {
    if (item.content) this.router.navigate(['/watch', item.content.id]);
  }

  remove(item: any) {
    if (!item.content) return;
    this.api.toggleFavorite(item.content.id).subscribe({
      next: () => { this.items = this.items.filter((i) => i.id !== item.id); },
    });
  }
}
