import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-content-card',
  template: `
    <div class="cc" [class.cc-grid]="variant === 'grid'">
      <div class="cc-skeleton" *ngIf="!loaded">
        <div class="cc-skeleton-badge">&#9673;</div>
        <span class="cc-skeleton-text">MANYAK TV</span>
      </div>

      <img class="cc-img" [class.cc-img-on]="loaded"
           [src]="item?.posterUrl || placeholder"
           [alt]="item?.title"
           loading="lazy"
           (load)="loaded = true" (error)="loaded = true" />

      <div class="cc-grad"></div>

      <div class="cc-premium" *ngIf="item?.isPremium">PREMIUM</div>

      <div class="cc-tags">
        <span class="cc-tag cc-tag-red" *ngIf="item?.type === 'short_drama'">SHORTS</span>
        <span class="cc-tag cc-tag-purple" *ngIf="item?.type === 'series'">SERIAL</span>
        <span class="cc-tag cc-tag-blue" *ngIf="item?.type === 'anime_series'">ANIME</span>
      </div>

      <div class="cc-hover">
        <div class="cc-hover-circle">{{ locked ? '&#128274;' : '&#9654;' }}</div>
      </div>

      <div class="cc-foot">
        <h4 class="cc-title">{{ item?.title }}</h4>
        <div class="cc-meta">
          <span>{{ item?.year }}</span>
          <span class="cc-price" *ngIf="item?.price > 0">{{ priceLabel }}</span>
          <span class="cc-free" *ngIf="!item?.price">Bepul</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cc {
      position: relative; flex-shrink: 0;
      width: 132px; aspect-ratio: 2 / 3;
      border-radius: 12px; overflow: hidden; cursor: pointer;
      background: #09090b; border: 1px solid rgba(39,39,42,0.8);
      transition: transform 0.3s, border-color 0.3s;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
    }
    .cc-grid { width: 100%; }
    .cc:active { transform: scale(0.97); }
    .cc-skeleton {
      position: absolute; inset: 0; z-index: 0; background: #18181b;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      pointer-events: none;
    }
    .cc-skeleton-badge { color: #ef4444; opacity: 0.4; font-size: 18px; }
    .cc-skeleton-text {
      font-size: 9px; font-weight: 700; color: #71717a;
      margin-top: 4px; letter-spacing: 0.1em;
    }
    .cc-img {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; object-position: center;
      opacity: 0; transition: opacity 0.5s;
    }
    .cc-img-on { opacity: 1; }
    .cc-grad {
      position: absolute; inset: 0; pointer-events: none; opacity: 0.9;
      background: linear-gradient(to top, #000 0%, rgba(0,0,0,0.4) 45%, transparent 100%);
    }
    .cc-premium {
      position: absolute; top: 7px; right: 7px; z-index: 10;
      background: linear-gradient(to right, #f59e0b, #d97706);
      color: #09090b; font-size: 8px; font-weight: 900;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding: 2px 6px; border-radius: 4px;
    }
    .cc-tags {
      position: absolute; top: 7px; left: 7px; z-index: 10;
      display: flex; flex-direction: column; gap: 4px; align-items: flex-start;
    }
    .cc-tag {
      color: #fff; font-size: 8px; font-weight: 700;
      padding: 2px 6px; border-radius: 4px;
    }
    .cc-tag-red { background: rgba(220,38,38,0.9); }
    .cc-tag-purple { background: rgba(147,51,234,0.9); }
    .cc-tag-blue { background: rgba(37,99,235,0.9); }
    .cc-hover {
      position: absolute; inset: 0; z-index: 10;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.4); opacity: 0; transition: opacity 0.25s;
    }
    .cc:hover .cc-hover { opacity: 1; }
    .cc-hover-circle {
      width: 40px; height: 40px; border-radius: 999px;
      background: rgba(220,38,38,0.9); color: #fff;
      display: flex; align-items: center; justify-content: center; font-size: 16px;
    }
    .cc-foot {
      position: absolute; left: 0; right: 0; bottom: 0; z-index: 10;
      padding: 8px 9px; display: flex; flex-direction: column;
    }
    .cc-title {
      font-size: 12px; font-weight: 700; color: #fff; line-height: 1.25;
      margin: 0 0 5px; display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
      text-shadow: 0 2px 6px rgba(0,0,0,0.9);
    }
    .cc-meta {
      display: flex; align-items: center; justify-content: space-between;
      font-size: 10px; color: #d4d4d8; font-weight: 500;
    }
    .cc-price { color: #f87171; font-weight: 700; }
    .cc-free { color: #34d399; font-weight: 700; }
  `],
})
export class ContentCardComponent {
  @Input() item: any = null;
  @Input() hasAccess = true;
  @Input() variant: 'row' | 'grid' = 'row';

  loaded = false;
  placeholder = 'data:image/svg+xml;utf8,'
    + '%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22%3E'
    + '%3Crect width=%22200%22 height=%22300%22 fill=%22%2318181b%22/%3E%3C/svg%3E';

  get locked(): boolean {
    return !this.hasAccess && !!(this.item && this.item.isPremium);
  }

  get priceLabel(): string {
    const p = this.item && this.item.price ? Number(this.item.price) : 0;
    return p.toLocaleString('ru-RU') + ' som';
  }
}
