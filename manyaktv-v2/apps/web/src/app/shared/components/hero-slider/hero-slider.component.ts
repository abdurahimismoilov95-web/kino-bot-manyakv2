import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { environment } from '../../../../environments/environment';

/** manyak-tv1 HeroSlider.tsx dizayni */
@Component({
  selector: 'app-hero-slider',
  template: `
    <div class="hs" *ngIf="items && items.length">
      <div class="hs-stage">
        <div class="hs-slide" *ngFor="let it of items; let i = index"
             [class.hs-on]="i === index">
          <div class="hs-ph">
            <span class="hs-ph-t">{{ it?.title }}</span>
          </div>
          <img *ngIf="srcOf(it, i)" class="hs-img" [src]="srcOf(it, i)" [alt]="it?.title || ''" (error)="onImgError(it, i)" />
          <div class="hs-shade"></div>

          <div class="hs-body">
            <div class="hs-tags">
              <span class="hs-tag-hot"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3.5-1.5 5.5-1.5 8 0 1.4 1 2.5 2.3 2.5 1.6 0 2.4-1.3 2.2-3.2C17.6 11 19 13.4 19 16a7 7 0 0 1-14 0c0-4.3 3.4-6.9 5-9.2C11 5.4 11.8 3.8 12 2z"/></svg> TREND</span>
              <span class="hs-tag" *ngIf="it?.year">{{ it?.year }}</span>
              <span class="hs-tag hs-star" *ngIf="it?.rating">&#9733; {{ ratingOf(it) }}</span>
            </div>

            <h2 class="hs-title">{{ it?.title }}</h2>
            <p class="hs-desc">{{ it?.description }}</p>

            <div class="hs-actions">
              <button class="hs-play" (click)="play.emit(it)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg> Tomosha qilish
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
    .hs-ph {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: flex-end;
      padding-right: 18px; overflow: hidden;
      background: radial-gradient(circle at 80% 30%, rgba(220,38,38,0.45), transparent 55%),
                  radial-gradient(circle at 20% 80%, rgba(245,158,11,0.18), transparent 50%),
                  linear-gradient(135deg, #1c1917, #09090b);
    }
    .hs-ph-t {
      font-size: 64px; font-weight: 900; color: rgba(255,255,255,0.06);
      text-transform: uppercase; letter-spacing: -0.03em; white-space: nowrap;
    }
    .hs-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
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
      display: inline-flex; align-items: center; gap: 4px;
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
  /** Har bir slayd uchun nechanchi rasm varianti sinalayotgani */
  private attempt: Record<string, number> = {};

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

  private abs(u: string): string {
    if (!u) { return ''; }
    if (/^(https?:|data:|blob:)/i.test(u)) { return u; }
    const origin = String(environment.apiUrl || '').replace(/\/api\/v1\/?$/, '');
    return origin + (u.charAt(0) === '/' ? u : '/' + u);
  }

  private keyOf(it: any, i: number): string {
    return String((it && it.id) || i);
  }

  /** Banner -> backdrop -> poster -> thumbnail ketma-ketligida sinaydi */
  private candidates(it: any): string[] {
    if (!it) { return []; }
    const list = [it.bannerUrl, it.backdropUrl, it.posterUrl, it.thumbnailUrl]
      .filter((u: any) => typeof u === 'string' && u.trim().length > 0)
      .map((u: string) => this.abs(u.trim()));
    return list.filter((u, idx) => list.indexOf(u) === idx);
  }

  srcOf(it: any, i: number): string {
    const list = this.candidates(it);
    const n = this.attempt[this.keyOf(it, i)] || 0;
    return n < list.length ? list[n] : '';
  }

  onImgError(it: any, i: number): void {
    const k = this.keyOf(it, i);
    this.attempt[k] = (this.attempt[k] || 0) + 1;
  }

  ratingOf(it: any): string {
    return it && it.rating ? Number(it.rating).toFixed(1) : '';
  }
}
