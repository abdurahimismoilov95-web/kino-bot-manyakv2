import { Component, Input } from '@angular/core';

/** manyak-tv1 ContentCard.tsx dizayni */
@Component({
  selector: 'app-content-card',
  template: `
    <div class="cc" [class.cc-grid]="variant === 'grid'">
      <div class="cc-poster">
        <img [src]="poster" [alt]="title" loading="lazy" (error)="onImgError($event)" />
        <div class="cc-shade"></div>

        <div class="cc-badges">
          <span class="cc-badge cc-b-new" *ngIf="isNew">YANGI</span>
          <span class="cc-badge cc-b-vip" *ngIf="locked">&#128274; VIP</span>
          <span class="cc-badge cc-b-free" *ngIf="!isPremium">BEPUL</span>
        </div>

        <div class="cc-rating" *ngIf="rating">&#9733; {{ rating }}</div>

        <div class="cc-play"><span>&#9654;</span></div>

        <div class="cc-eps" *ngIf="episodesLabel">{{ episodesLabel }}</div>
      </div>

      <div class="cc-meta">
        <h4 class="cc-title">{{ title }}</h4>
        <div class="cc-sub">
          <span *ngIf="year">{{ year }}</span>
          <span class="cc-dot" *ngIf="year && typeLabel">&#8226;</span>
          <span class="cc-type" *ngIf="typeLabel">{{ typeLabel }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .cc {
      width: 132px; flex-shrink: 0; cursor: pointer;
      transition: transform 0.25s ease;
    }
    .cc:active { transform: scale(0.96); }
    .cc-grid { width: 100%; }
    .cc-poster {
      position: relative; width: 100%; aspect-ratio: 2 / 3;
      border-radius: 14px; overflow: hidden;
      background: #18181b; border: 1px solid rgba(63,63,70,0.55);
      box-shadow: 0 6px 18px rgba(0,0,0,0.45);
    }
    .cc-poster img {
      width: 100%; height: 100%; object-fit: cover; display: block;
      transition: transform 0.35s ease;
    }
    .cc:hover .cc-poster img { transform: scale(1.06); }
    .cc-shade {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.05) 55%, transparent 100%);
    }
    .cc-badges {
      position: absolute; top: 6px; left: 6px;
      display: flex; flex-direction: column; gap: 4px; align-items: flex-start;
    }
    .cc-badge {
      font-size: 9px; font-weight: 900; letter-spacing: 0.04em;
      padding: 2px 6px; border-radius: 6px; color: #fff;
      backdrop-filter: blur(6px); text-transform: uppercase;
    }
    .cc-b-new { background: linear-gradient(90deg, #10b981, #16a34a); }
    .cc-b-vip { background: linear-gradient(90deg, #f59e0b, #d97706); color: #1c1917; }
    .cc-b-free { background: rgba(9,9,11,0.7); color: #34d399; border: 1px solid rgba(52,211,153,0.4); }
    .cc-rating {
      position: absolute; top: 6px; right: 6px;
      font-size: 10px; font-weight: 800; color: #fbbf24;
      background: rgba(9,9,11,0.72); border-radius: 6px;
      padding: 2px 6px; backdrop-filter: blur(6px);
    }
    .cc-play {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.2s;
    }
    .cc-play span {
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(220,38,38,0.92); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; padding-left: 3px;
      box-shadow: 0 6px 18px rgba(220,38,38,0.5);
    }
    .cc:hover .cc-play { opacity: 1; }
    .cc-eps {
      position: absolute; bottom: 6px; right: 6px;
      font-size: 9px; font-weight: 800; color: #e4e4e7;
      background: rgba(9,9,11,0.75); padding: 2px 6px; border-radius: 6px;
    }
    .cc-meta { padding: 7px 2px 0; }
    .cc-title {
      margin: 0; font-size: 12.5px; font-weight: 700; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      line-height: 1.25;
    }
    .cc-sub {
      display: flex; align-items: center; gap: 4px;
      margin-top: 2px; font-size: 10px; color: #a1a1aa;
    }
    .cc-dot { color: #52525b; }
    .cc-type { color: #f87171; font-weight: 800; text-transform: uppercase; }
  `],
})
export class ContentCardComponent {
  @Input() item: any = null;
  @Input() hasAccess = false;
  @Input() variant: 'row' | 'grid' = 'row';

  private readonly fallback =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">' +
        '<rect width="200" height="300" fill="#18181b"/>' +
        '<text x="100" y="155" font-size="40" fill="#3f3f46" text-anchor="middle">MTV</text>' +
      '</svg>',
    );

  get title(): string { return this.item && this.item.title ? this.item.title : ''; }
  get year(): string { return this.item && this.item.year ? String(this.item.year) : ''; }

  get poster(): string {
    if (!this.item) { return this.fallback; }
    return this.item.posterUrl || this.item.poster || this.item.thumbnailUrl || this.fallback;
  }

  get rating(): string {
    if (!this.item || !this.item.rating) { return ''; }
    return Number(this.item.rating).toFixed(1);
  }

  get isPremium(): boolean {
    return !!(this.item && (this.item.isPremium || this.item.isVipOnly));
  }

  get locked(): boolean {
    return this.isPremium && !this.hasAccess;
  }

  get isNew(): boolean {
    if (!this.item || !this.item.createdAt) { return false; }
    const created = new Date(this.item.createdAt).getTime();
    if (!created) { return false; }
    return Date.now() - created < 30 * 24 * 60 * 60 * 1000;
  }

  get episodesLabel(): string {
    if (!this.item) { return ''; }
    const count = this.item.episodeCount || (this.item.episodes ? this.item.episodes.length : 0);
    if (!count) { return ''; }
    return count + ' qism';
  }

  get typeLabel(): string {
    if (!this.item || !this.item.type) { return ''; }
    const map: Record<string, string> = {
      movie: 'Kino',
      series: 'Serial',
      short_drama: 'Mini drama',
      anime_series: 'Anime',
    };
    return map[this.item.type] || this.item.type;
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.fallback) { img.src = this.fallback; }
  }
}
