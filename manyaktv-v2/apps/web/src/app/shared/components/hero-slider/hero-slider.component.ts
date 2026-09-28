import {
  Component, Input, Output, EventEmitter, OnChanges, OnDestroy,
} from '@angular/core';

@Component({
  selector: 'app-hero-slider',
  template: `
    <section class="hs-wrap" *ngIf="items && items.length > 0">
      <div class="hs-card">
        <img *ngFor="let item of items; let i = index"
             [src]="item.bannerUrl || item.posterUrl"
             [alt]="item.title"
             class="hs-img"
             [class.hs-active]="i === currentIndex" />

        <div class="hs-grad-b"></div>
        <div class="hs-grad-l"></div>

        <div class="hs-premium" *ngIf="current?.isPremium">PREMIUM</div>

        <div class="hs-info">
          <h3 class="hs-title">{{ current?.title }}</h3>
          <div class="hs-actions">
            <button class="hs-play" (click)="play.emit(current)">&#9654; Tomosha</button>
            <button class="hs-info-btn" (click)="details.emit(current)" title="Batafsil">i</button>
          </div>
        </div>
      </div>

      <div class="hs-dots">
        <button *ngFor="let item of items; let i = index"
                class="hs-dot" [class.hs-dot-active]="i === currentIndex"
                (click)="go(i)"></button>
      </div>
    </section>
  `,
  styles: [`
    .hs-wrap { position: relative; width: 100%; padding: 4px 12px 12px; }
    .hs-card {
      position: relative; width: 100%; aspect-ratio: 16 / 7;
      border-radius: 14px; overflow: hidden; background: #18181b;
      border: 1px solid rgba(39, 39, 42, 0.8);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
    }
    .hs-img {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; object-position: center;
      opacity: 0; transform: scale(1.05);
      transition: opacity 1s ease-in-out, transform 1s ease-in-out;
    }
    .hs-active { opacity: 1; transform: scale(1); }
    .hs-grad-b {
      position: absolute; inset: 0; pointer-events: none;
      background: linear-gradient(to top, #09090b 0%, rgba(9,9,11,0.4) 45%, transparent 100%);
    }
    .hs-grad-l {
      position: absolute; inset: 0; pointer-events: none;
      background: linear-gradient(to right, rgba(9,9,11,0.8) 0%, transparent 60%);
    }
    .hs-premium {
      position: absolute; top: 8px; right: 8px; z-index: 2;
      background: linear-gradient(to right, #f59e0b, #d97706);
      color: #09090b; font-size: 9px; font-weight: 900;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding: 2px 7px; border-radius: 4px;
    }
    .hs-info {
      position: absolute; left: 0; right: 0; bottom: 0; z-index: 2;
      padding: 12px 14px; display: flex; flex-direction: column;
    }
    .hs-title {
      font-size: 18px; font-weight: 900; color: #fff; letter-spacing: -0.02em;
      margin: 0 0 8px; text-shadow: 0 2px 8px rgba(0,0,0,0.8);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .hs-actions { display: flex; align-items: center; gap: 8px; }
    .hs-play {
      display: inline-flex; align-items: center; gap: 5px;
      background: #dc2626; color: #fff; font-weight: 800;
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
      padding: 6px 12px; border-radius: 6px; border: none;
    }
    .hs-play:active { transform: scale(0.95); }
    .hs-info-btn {
      width: 28px; height: 28px; border-radius: 6px;
      background: rgba(39,39,42,0.9); color: #e4e4e7;
      border: 1px solid rgba(63,63,70,0.8);
      font-style: italic; font-weight: 700; font-size: 13px;
    }
    .hs-dots { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; }
    .hs-dot {
      width: 6px; height: 6px; border-radius: 999px; border: none;
      background: #3f3f46; padding: 0; transition: all 0.3s;
    }
    .hs-dot-active { width: 20px; background: #dc2626; }
  `],
})
export class HeroSliderComponent implements OnChanges, OnDestroy {
  @Input() items: any[] = [];
  @Output() play = new EventEmitter<any>();
  @Output() details = new EventEmitter<any>();

  currentIndex = 0;
  private timer: any = null;

  get current(): any {
    return this.items && this.items.length ? this.items[this.currentIndex] : null;
  }

  ngOnChanges(): void {
    this.currentIndex = 0;
    this.restart();
  }

  ngOnDestroy(): void {
    if (this.timer) { clearInterval(this.timer); }
  }

  go(index: number): void {
    this.currentIndex = index;
    this.restart();
  }

  private restart(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (!this.items || this.items.length <= 1) { return; }
    this.timer = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.items.length;
    }, 4500);
  }
}
