import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

/** manyak-tv1 HeroSlider.tsx dizayni */
@Component({
  selector: 'app-hero-slider',
  template: `
    <div class="hs" *ngIf="items && items.length">
      <div class="hs-stage">
        <div class="hs-slide" *ngFor="let it of items; let i = index"
             [class.hs-on]="i === index">
          <img [src]="backdrop(it)" [alt]="it?.title || ''" (error)="onImgError($event)" />
          <div class="hs-shade"></div>

          <div class="hs-body">
            <div class="hs-tags">
              <span class="hs-tag-hot">&#128293; TREND</span>
              <span class="hs-tag" *ngIf="it?.year">{{ it?.year }}</span>
              <span class="hs-tag hs-star" *ngIf="it?.rating">&#9733; {{ ratingOf(it) }}</span>
            </div>

            <h2 class="hs-title">{{ it?.title }}</h2>
            <p class="hs-desc">{{ it?.description }}</p>

            <div class="hs-actions">
              <button class="hs-play" (click)="play.emit(it)">
                <span class="hs-ico">&#9654;</span> Tomosha qilish
              </button>
              <button class="hs-info" (click)="details.emit(it)">Batafsil</button>
            </div>
          </div>
        </div>
      </div>

      <div class="hs-dots">
        <button *ngFor="let it of items; let i = index"
                class="hs-dot" [class.hs-dot-on]="i === index"
                (click)="go(i)"></button>
      </div>
    </div>
  `,
  styles: [`
    .hs { position: relative; width: 100%; }
    .hs-stage {
      position: relative; width: 100%; aspect-ratio: 16 / 9;
      max-height: 62vh; overflow: hidden; background: #09090b;
    }
    @media (min-width: 640px) { .hs-stage { aspect-ratio: 16 / 7; } }
    .hs-slide {
      position: absolute; inset: 0; opacity: 0;
      transition: opacity 0.7s ease; pointer-events: none;
    }
    .hs-slide.hs-on { opacity: 1; pointer-events: auto; }
    .hs-slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .hs-shade {
      position: absolute; inset: 0;
      background:
        linear-gradient(to top, #0f0f0f 2%, rgba(15,15,15,0.55) 42%, rgba(15,15,15,0.1) 100%),
        linear-gradient(to right, rgba(9,9,11,0.85), transparent 65%);
    }
    .hs-body { position: absolute; left: 0; right: 0; bottom: 0; padding: 0 16px 18px; }
    .hs-tags { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
    .hs-tag {
      font-size: 10px; font-weight: 800; color: #d4d4d8;
      background: rgba(39,39,42,0.75); border: 1px solid rgba(63,63,70,0.8);
      padding: 2px 7px; border-radius: 6px; backdrop-filter: blur(6px);
    }
    .hs-star { color: #fbbf24; }
    .hs-tag-hot {
      font-size: 10px; font-weight: 900; color: #fff;
      background: linear-gradient(90deg, #dc2626, #b91c1c);
      padding: 2px 8px; border-radius: 6px; letter-spacing: 0.04em;
      box-shadow: 0 4px 14px rgba(220,38,38,0.45);
    }
    .hs-title {
      margin: 0; font-size: 26px; line-height: 1.1; font-weight: 900;
      color: #fff; letter-spacing: -0.02em;
      text-shadow: 0 4px 22px rgba(0,0,0,0.85);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .hs-desc {
      margin: 6px 0 0; font-size: 12px; color: #a1a1aa; line-height: 1.45;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
      max-width: 560px;
    }
    .hs-actions { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
    .hs-play {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 10px 20px; border-radius: 12px; border: none;
      background: #dc2626; color: #fff; font-size: 13.5px; font-weight: 800;
      box-shadow: 0 8px 22px rgba(220,38,38,0.45); cursor: pointer;
    }
    .hs-play:active { transform: scale(0.97); }
    .hs-ico { font-size: 12px; }
    .hs-info {
      padding: 10px 18px; border-radius: 12px;
      background: rgba(39,39,42,0.8); color: #e4e4e7;
      border: 1px solid rgba(82,82,91,0.8);
      font-size: 13.5px; font-weight: 700; backdrop-filter: blur(8px); cursor: pointer;
    }
    .hs-dots {
      position: absolute; bottom: 8px; right: 16px;
      display: flex; align-items: center; gap: 5px;
    }
    .hs-dot {
      width: 6px; height: 6px; border-radius: 999px; border: none;
      background: rgba(255,255,255,0.35); padding: 0; cursor: pointer;
      transition: all 0.3s;
    }
    .hs-dot-on { width: 18px; background: #dc2626; }
  `],
})
export class HeroSliderComponent implements OnInit, OnDestroy {
  @Input() items: any[] = [];
  @Output() play = new EventEmitter<any>();
  @Output() details = new EventEmitter<any>();

  index = 0;
  private timer: any = null;

  private readonly fallback =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">' +
        '<rect width="640" height="360" fill="#09090b"/>' +
      '</svg>',
    );

  ngOnInit(): void {
    this.timer = setInterval(() => {
      if (!this.items || this.items.length < 2) { return; }
      this.index = (this.index + 1) % this.items.length;
    }, 4500);
  }

  ngOnDestroy(): void {
    if (this.timer) { clearInterval(this.timer); }
  }

  go(i: number): void { this.index = i; }

  backdrop(it: any): string {
    if (!it) { return this.fallback; }
    return it.backdropUrl || it.bannerUrl || it.posterUrl || this.fallback;
  }

  ratingOf(it: any): string {
    return it && it.rating ? Number(it.rating).toFixed(1) : '';
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.fallback) { img.src = this.fallback; }
  }
}
