import { Component, Input } from '@angular/core';

/** manyak-tv1 ContentCard.tsx dizayni: nom, yil va narx poster ustida */
@Component({
  selector: 'app-content-card',
  template: `
    <div class="cc" [class.cc-grid]="variant === 'grid'">
      <div class="cc-ph" *ngIf="!loaded">
        <div class="cc-phi">&#9654;</div>
        <span class="cc-pht">MANYAK TV</span>
      </div>

      <img class="cc-img" [class.on]="loaded" [src]="poster" [alt]="title" loading="lazy"
           (load)="loaded = true" (error)="onImgError($event)" />

      <div class="cc-shade"></div>

      <div class="cc-prem" *ngIf="isPremium">PREMIUM</div>

      <div class="cc-types">
        <span class="cc-t cc-t-short" *ngIf="item && item.type === 'short_drama'">SHORTS</span>
        <span class="cc-t cc-t-serial" *ngIf="item && item.type === 'series'">SERIAL</span>
        <span class="cc-t cc-t-anime" *ngIf="item && item.type === 'anime_series'">ANIME</span>
      </div>

      <div class="cc-play">
        <span [class.lk]="locked">{{ locked ? '\uD83D\uDD12' : '\u25B6' }}</span>
      </div>

      <div class="cc-foot">
        <h4 class="cc-title">{{ title }}</h4>
        <div class="cc-row">
          <span>{{ year }}</span>
          <span class="cc-price" *ngIf="price > 0">{{ priceLabel }}</span>
          <span class="cc-free" *ngIf="price <= 0">Bepul</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .cc {
      position: relative; width: 132px; flex-shrink: 0; cursor: pointer;
      aspect-ratio: 2 / 3; border-radius: 12px; overflow: hidden;
      background: #09090b; border: 1px solid rgba(39,39,42,0.8);
      box-shadow: 0 4px 10px rgba(0,0,0,0.4);
      transition: transform 0.3s ease, border-color 0.3s ease;
    }
    @media (min-width: 640px) { .cc { width: 144px; } }
    @media (min-width: 768px) { .cc { width: 176px; } }
    .cc:hover { transform: scale(1.03); border-color: #3f3f46; }
    .cc:active { transform: scale(0.97); }
    .cc-grid { width: 100%; }
    .cc-ph {
      position: absolute; inset: 0; background: #18181b;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .cc-phi { width: 32px; height: 32px; border-radius: 8px; background: #27272a; color: #ef4444; opacity: 0.5; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .cc-pht { font-size: 9px; font-weight: 700; color: #71717a; margin-top: 4px; letter-spacing: 0.08em; opacity: 0.7; }
    .cc-img {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; object-position: center; opacity: 0;
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .cc-img.on { opacity: 1; }
    .cc:hover .cc-img { transform: scale(1.05); }
    .cc-shade {
      position: absolute; inset: 0; pointer-events: none; opacity: 0.9;
      background: linear-gradient(to top, #000 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
    }
    .cc-prem {
      position: absolute; top: 8px; right: 8px; z-index: 2;
      background: linear-gradient(90deg, #f59e0b, #d97706); color: #09090b;
      font-size: 9px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase;
      padding: 2px 6px; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }
    .cc-types { position: absolute; top: 8px; left: 8px; z-index: 2; display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
    .cc-t { color: #fff; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
    .cc-t-short { background: rgba(220,38,38,0.9); }
    .cc-t-serial { background: rgba(147,51,234,0.9); }
    .cc-t-anime { background: rgba(37,99,235,0.9); }
    .cc-play {
      position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.4); opacity: 0; transition: opacity 0.25s;
    }
    .cc:hover .cc-play { opacity: 1; }
    .cc-play span {
      width: 40px; height: 40px; border-radius: 50%; background: rgba(220,38,38,0.92); color: #fff;
      display: flex; align-items: center; justify-content: center; font-size: 16px; padding-left: 3px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.25s;
    }
    .cc-play span.lk { padding-left: 0; }
    .cc:hover .cc-play span { transform: scale(1); }
    .cc-foot { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; padding: 8px 10px; display: flex; flex-direction: column; justify-content: flex-end; }
    .cc-title {
      margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #fff; line-height: 1.2;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      text-shadow: 0 1px 4px rgba(0,0,0,0.8); transition: color 0.2s;
    }
    .cc:hover .cc-title { color: #f87171; }
    .cc-row { display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #d4d4d8; font-weight: 500; text-shadow: 0 1px 3px rgba(0,0,0,0.8); }
    .cc-price { color: #f87171; font-weight: 700; }
    .cc-free { color: #34d399; font-weight: 700; }
  `],
})
export class ContentCardComponent {
  @Input() item: any = null;
  @Input() hasAccess = false;
  @Input() variant: 'row' | 'grid' = 'row';

  loaded = false;

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

  get price(): number {
    return this.item && this.item.price ? Number(this.item.price) : 0;
  }

  get priceLabel(): string {
    return this.price.toLocaleString() + ' so\'m';
  }

  get isPremium(): boolean {
    return !!(this.item && (this.item.isPremium || this.item.isVipOnly));
  }

  get locked(): boolean {
    return this.isPremium && !this.hasAccess;
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.fallback) { img.src = this.fallback; }
    this.loaded = true;
  }
}
