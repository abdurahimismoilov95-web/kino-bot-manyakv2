import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-content-details',
  template: `
    <div class="cd-overlay" *ngIf="item" (click)="close.emit()">
      <div class="cd-sheet" (click)="$event.stopPropagation()">
        <div class="cd-banner">
          <img [src]="item.bannerUrl || item.posterUrl" [alt]="item.title" />
          <div class="cd-banner-grad"></div>
          <button class="cd-close" (click)="close.emit()">&#10005;</button>
        </div>

        <div class="cd-body">
          <h2 class="cd-title">{{ item.title }}</h2>
          <p class="cd-orig" *ngIf="item.originalTitle">{{ item.originalTitle }}</p>

          <div class="cd-meta">
            <span *ngIf="item.year">{{ item.year }}</span>
            <span *ngIf="item.duration">{{ item.duration }} daq</span>
            <span *ngIf="item.rating">&#9733; {{ item.rating }}</span>
            <span class="cd-badge" *ngIf="item.isPremium">PREMIUM</span>
          </div>

          <div class="cd-genres" *ngIf="genres.length">
            <span class="cd-genre" *ngFor="let g of genres">{{ g }}</span>
          </div>

          <p class="cd-desc" *ngIf="item.description">{{ item.description }}</p>

          <div class="cd-actions">
            <button class="cd-play" (click)="play.emit(item)">&#9654; Tomosha qilish</button>
            <button class="cd-fav" (click)="favorite.emit(item)">&#9825;</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cd-overlay {
      position: fixed; inset: 0; z-index: 60;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
      display: flex; align-items: flex-end; justify-content: center;
    }
    .cd-sheet {
      width: 100%; max-width: 560px; max-height: 88vh; overflow-y: auto;
      background: #111113; border-top-left-radius: 20px; border-top-right-radius: 20px;
      border: 1px solid rgba(63,63,70,0.7); border-bottom: none;
      animation: cd-up 0.25s ease-out;
    }
    @keyframes cd-up { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
    .cd-banner { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #18181b; }
    .cd-banner img { width: 100%; height: 100%; object-fit: cover; }
    .cd-banner-grad {
      position: absolute; inset: 0;
      background: linear-gradient(to top, #111113 0%, transparent 65%);
    }
    .cd-close {
      position: absolute; top: 10px; right: 10px;
      width: 32px; height: 32px; border-radius: 999px;
      background: rgba(0,0,0,0.6); color: #fff; border: 1px solid rgba(63,63,70,0.8);
      font-size: 14px;
    }
    .cd-body { padding: 4px 16px 24px; }
    .cd-title { margin: 0; font-size: 20px; font-weight: 900; color: #fff; }
    .cd-orig { margin: 2px 0 0; font-size: 12px; color: #71717a; }
    .cd-meta {
      display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
      margin-top: 10px; font-size: 12px; color: #a1a1aa;
    }
    .cd-badge {
      background: linear-gradient(to right, #f59e0b, #d97706); color: #09090b;
      font-size: 9px; font-weight: 900; padding: 2px 7px; border-radius: 4px;
    }
    .cd-genres { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .cd-genre {
      font-size: 11px; color: #d4d4d8; padding: 3px 9px; border-radius: 999px;
      background: rgba(39,39,42,0.9); border: 1px solid rgba(63,63,70,0.6);
    }
    .cd-desc { margin-top: 12px; font-size: 13px; line-height: 1.6; color: #d4d4d8; }
    .cd-actions { display: flex; gap: 10px; margin-top: 18px; }
    .cd-play {
      flex: 1; padding: 12px; border-radius: 12px; border: none;
      background: #dc2626; color: #fff; font-size: 14px; font-weight: 800;
    }
    .cd-fav {
      width: 48px; border-radius: 12px; font-size: 18px;
      background: rgba(39,39,42,0.9); color: #f87171;
      border: 1px solid rgba(63,63,70,0.7);
    }
  `],
})
export class ContentDetailsComponent {
  @Input() item: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() play = new EventEmitter<any>();
  @Output() favorite = new EventEmitter<any>();

  get genres(): string[] {
    if (!this.item || !this.item.genres) { return []; }
    if (Array.isArray(this.item.genres)) { return this.item.genres; }
    return String(this.item.genres).split(',').map((g: string) => g.trim()).filter(Boolean);
  }
}
