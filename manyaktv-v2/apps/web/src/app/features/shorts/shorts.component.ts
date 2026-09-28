import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-shorts',
  template: `
    <div class="sh">
      <div class="sh-top">
        <button class="sh-back" (click)="back()">&#8592;</button>
        <span class="sh-name">Mini dramalar</span>
      </div>

      <div class="sh-feed">
        <article class="sh-item" *ngFor="let item of items" (click)="open(item)">
          <img class="sh-poster" [src]="item.posterUrl" [alt]="item.title" loading="lazy" />
          <div class="sh-grad"></div>
          <div class="sh-info">
            <p class="sh-title">{{ item.title }}</p>
            <p class="sh-sub" *ngIf="item.description">{{ item.description }}</p>
            <span class="sh-play">&#9654; Korish</span>
          </div>
        </article>

        <p class="sh-empty" *ngIf="!loading && !items.length">Mini drama topilmadi.</p>
        <p class="sh-empty" *ngIf="loading">Yuklanmoqda...</p>
      </div>
    </div>
  `,
  styles: [`
    .sh { background: #000; min-height: 100dvh; padding-bottom: 90px; }
    .sh-top {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      position: sticky; top: 0; z-index: 30;
      background: rgba(0,0,0,0.9); backdrop-filter: blur(8px);
    }
    .sh-back {
      width: 32px; height: 32px; border-radius: 999px;
      background: rgba(39,39,42,0.9); color: #fff;
      border: 1px solid rgba(63,63,70,0.7); font-size: 16px;
    }
    .sh-name { font-size: 14px; font-weight: 700; color: #fff; }
    .sh-feed {
      height: calc(100dvh - 142px); overflow-y: auto;
      scroll-snap-type: y mandatory;
    }
    .sh-item {
      position: relative; display: block; width: 100%;
      height: calc(100dvh - 142px); scroll-snap-align: start;
      background: #09090b; overflow: hidden;
    }
    .sh-poster { width: 100%; height: 100%; object-fit: cover; }
    .sh-grad {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 55%);
    }
    .sh-info { position: absolute; left: 14px; right: 14px; bottom: 24px; }
    .sh-title { margin: 0; font-size: 18px; font-weight: 900; color: #fff; }
    .sh-sub {
      margin: 6px 0 0; font-size: 12px; color: #d4d4d8; line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .sh-play {
      display: inline-block; margin-top: 12px; padding: 9px 18px;
      border-radius: 999px; background: #dc2626; color: #fff;
      font-size: 13px; font-weight: 800;
    }
    .sh-empty { color: #71717a; font-size: 13px; text-align: center; padding: 40px 0; }
  `],
})
export class ShortsComponent implements OnInit {
  items: any[] = [];
  loading = true;

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.api.getContent({ type: 'short_drama', page: 1, limit: 30 }).subscribe({
      next: (r: any) => {
        this.items = Array.isArray(r) ? r : (r && r.data ? r.data : []);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  open(item: any): void {
    if (!item) { return; }
    this.router.navigate(['/watch', item.id]);
  }

  back(): void { this.router.navigate(['/']); }
}
