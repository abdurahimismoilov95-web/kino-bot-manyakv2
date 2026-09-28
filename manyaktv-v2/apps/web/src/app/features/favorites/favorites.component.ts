import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';

/** manyak-tv1 uslubidagi sevimlilar sahifasi */
@Component({
  selector: 'app-favorites',
  template: `
    <div class="fv">
      <div class="fv-head">
        <h2>&#9829; Saqlangan</h2>
        <span class="fv-count">{{ items.length }} ta</span>
      </div>

      <app-skeleton-card *ngIf="loading" variant="grid" [count]="6"></app-skeleton-card>

      <div class="fv-empty" *ngIf="!loading && !items.length">
        <div class="fv-empty-ico">&#9825;</div>
        <h4>Sevimli kontent yoq</h4>
        <p>Yoqqan kinolarni yurakcha tugmasi bilan saqlang.</p>
      </div>

      <div class="fv-grid" *ngIf="!loading && items.length">
        <app-content-card *ngFor="let item of items"
                          [item]="contentOf(item)" [hasAccess]="isVip" variant="grid"
                          (click)="open(item)"></app-content-card>
      </div>
    </div>
  `,
  styles: [`
    .fv { padding: 16px 14px 110px; background: #0f0f0f; min-height: 100dvh; }
    .fv-head { display: flex; align-items: baseline; justify-content: space-between; }
    .fv-head h2 { margin: 0; font-size: 18px; font-weight: 900; color: #fff; }
    .fv-count { font-size: 12px; color: #a1a1aa; }
    .fv-grid {
      display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px; margin-top: 16px;
    }
    @media (max-width: 360px) { .fv-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .fv-empty { text-align: center; padding: 60px 0; }
    .fv-empty-ico { font-size: 36px; color: #3f3f46; }
    .fv-empty h4 { margin: 10px 0 0; font-size: 15px; font-weight: 800; color: #d4d4d8; }
    .fv-empty p { margin: 6px auto 0; font-size: 12px; color: #71717a; max-width: 260px; }
  `],
})
export class FavoritesComponent implements OnInit {
  items: any[] = [];
  loading = true;
  isVip = false;

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly storage: StorageService,
  ) {}

  ngOnInit(): void {
    const u = this.storage.getUser();
    if (u) { this.isVip = !!u.isVip; }
    this.api.getFavorites().subscribe({
      next: (r: any) => {
        this.items = Array.isArray(r) ? r : (r && Array.isArray(r.data) ? r.data : []);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  contentOf(entry: any): any {
    if (!entry) { return null; }
    return entry.content || entry.contentItem || entry;
  }

  open(entry: any): void {
    const c = this.contentOf(entry);
    const id = entry?.contentId || (c && c.id);
    if (id) { this.router.navigate(['/watch', id]); }
  }
}
