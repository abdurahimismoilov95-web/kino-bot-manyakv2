import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * manyak-tv1 HomeView.tsx "Sotuv Vitrinasi" ($ tugmasi + modal) ko'chirmasi.
 * Alohida stil: amber (sariq) gradient, o'ng tomonda suzib turgan dollar tugmasi.
 */
@Component({
  selector: 'app-store-showcase',
  template: `
    <ng-container *ngIf="items && items.length">
      <button class="st-fab" *ngIf="!open" (click)="open = true">
        <span class="st-fab-txt">$</span>
      </button>

      <div class="st-ovl" *ngIf="open" (click)="open = false">
        <div class="st-card" (click)="stop($event)">
          <div class="st-head">
            <div class="st-head-l">
              <span class="st-spark">&#10022;</span>
              <h3>Sotuv Vitrinasi</h3>
            </div>
            <button class="st-x" (click)="open = false">&#10005;</button>
          </div>

          <div class="st-body">
            <div class="st-row">
              <div class="st-item" *ngFor="let item of items">
                <div class="st-poster" (click)="pick(item)">
                  <img [src]="posterOf(item)" [alt]="item?.title || ''" />
                  <span class="st-top1" *ngIf="item?.isFeaturedStore">#1</span>
                </div>

                <div class="st-info">
                  <div>
                    <div class="st-kind">
                      <span class="st-kind-t">{{ kindOf(item) }}</span>
                      <span class="st-kind-y" *ngIf="item?.year">&#8226; {{ item?.year }}</span>
                    </div>
                    <h4 (click)="pick(item)">{{ item?.title }}</h4>
                  </div>

                  <div class="st-foot">
                    <div>
                      <div class="st-price-l">Narxi:</div>
                      <div class="st-price">{{ priceOf(item) }} <small>UZS</small></div>
                    </div>
                    <button class="st-buy" *ngIf="!hasAccess" (click)="buyItem(item)">Sotib ol</button>
                    <button class="st-watch" *ngIf="hasAccess" (click)="pick(item)">Tomosha</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .st-fab {
      position: fixed; right: 14px; top: 50%; transform: translateY(-50%);
      z-index: 40; width: 46px; height: 46px; border-radius: 50%; cursor: pointer;
      background: linear-gradient(135deg, #d97706, #f59e0b);
      border: 2px solid rgba(251,191,36,0.35);
      box-shadow: 0 12px 30px rgba(217,119,6,0.45);
      display: flex; align-items: center; justify-content: center;
    }
    .st-fab-txt { font-size: 20px; font-weight: 900; color: #fff; }
    .st-ovl {
      position: fixed; inset: 0; z-index: 60; display: flex;
      align-items: center; justify-content: center; padding: 16px;
      background: rgba(0,0,0,0.65); backdrop-filter: blur(5px);
    }
    .st-card {
      width: 100%; max-width: 440px; max-height: 80vh; overflow: hidden;
      border-radius: 20px; border: 1px solid rgba(217,119,6,0.35);
      background: linear-gradient(180deg, rgba(24,24,27,0.97), rgba(9,9,11,0.97));
      box-shadow: 0 24px 60px rgba(0,0,0,0.7);
    }
    .st-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 11px 14px;
      background: linear-gradient(90deg, #d97706, #f59e0b);
    }
    .st-head-l { display: flex; align-items: center; gap: 8px; }
    .st-head-l h3 { margin: 0; font-size: 14.5px; font-weight: 900; color: #fff; }
    .st-spark { font-size: 15px; color: #fff; }
    .st-x {
      width: 28px; height: 28px; border-radius: 9px; border: none; cursor: pointer;
      background: rgba(69,26,3,0.35); color: #fff; font-size: 12px;
    }
    .st-body { padding: 14px; overflow-y: auto; max-height: calc(80vh - 52px); }
    .st-row { display: flex; gap: 11px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
    .st-row::-webkit-scrollbar { display: none; }
    .st-item {
      display: flex; gap: 9px; flex-shrink: 0; width: 226px; padding: 9px;
      border-radius: 14px; border: 1px solid rgba(217,119,6,0.4);
      background: linear-gradient(135deg, #18181b, rgba(69,26,3,0.3));
      box-shadow: 0 8px 20px rgba(0,0,0,0.4);
    }
    .st-poster {
      position: relative; width: 56px; height: 80px; flex-shrink: 0;
      border-radius: 10px; overflow: hidden; cursor: pointer; background: #09090b;
    }
    .st-poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .st-top1 {
      position: absolute; top: 3px; left: 3px;
      background: #f59e0b; color: #09090b; font-size: 8px; font-weight: 900;
      padding: 1px 4px; border-radius: 4px;
    }
    .st-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; }
    .st-kind { display: flex; align-items: center; gap: 4px; }
    .st-kind-t { font-size: 8.5px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.04em; }
    .st-kind-y { font-size: 8.5px; color: #71717a; }
    .st-info h4 {
      margin: 2px 0 0; font-size: 11.5px; font-weight: 800; color: #fff;
      cursor: pointer; display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .st-foot {
      display: flex; align-items: flex-end; justify-content: space-between;
      margin-top: 7px; padding-top: 5px; border-top: 1px solid rgba(39,39,42,0.9);
    }
    .st-price-l { font-size: 7.5px; color: #71717a; font-weight: 600; }
    .st-price { font-size: 11.5px; font-weight: 900; color: #fbbf24; }
    .st-price small { font-size: 8px; }
    .st-buy {
      padding: 4px 9px; border-radius: 8px; border: none; cursor: pointer;
      background: linear-gradient(90deg, #dc2626, #ef4444);
      color: #fff; font-size: 9.5px; font-weight: 800;
      box-shadow: 0 4px 12px rgba(220,38,38,0.3);
    }
    .st-watch {
      padding: 4px 9px; border-radius: 8px; border: none; cursor: pointer;
      background: #16a34a; color: #fff; font-size: 9.5px; font-weight: 800;
    }
  `],
})
export class StoreShowcaseComponent {
  @Input() items: any[] = [];
  @Input() hasAccess = false;
  @Output() select = new EventEmitter<any>();
  @Output() buy = new EventEmitter<any>();

  open = false;

  stop(event: Event): void { event.stopPropagation(); }

  posterOf(item: any): string {
    if (!item) { return ''; }
    return item.posterUrl || item.thumbnailUrl || '';
  }

  kindOf(item: any): string {
    if (!item) { return ''; }
    return (item.type === 'series' || item.type === 'anime_series') ? 'Serial' : 'Film';
  }

  priceOf(item: any): string {
    const p = Number((item && item.price) || 15000);
    return p.toLocaleString('ru-RU');
  }

  pick(item: any): void {
    this.open = false;
    this.select.emit(item);
  }

  buyItem(item: any): void {
    this.open = false;
    this.buy.emit(item);
  }
}
