import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-history',
  template: `
    <div class="history-page pb-20 px-4">
      <h1 class="page-title pt-5 mb-4">&#128250; Kuzatish tarixi</h1>

      <div *ngIf="loading" class="text-center py-10 text-gray-400">Yuklanmoqda...</div>

      <div *ngIf="!loading && items.length === 0" class="text-center py-16">
        <p class="text-4xl mb-3">&#128250;</p>
        <p class="text-gray-400">Hali hech narsa kormagansiz</p>
      </div>

      <div *ngIf="!loading && items.length > 0">
        <div class="history-item" *ngFor="let item of items" (click)="open(item)">
          <img
            [src]="item.content?.posterUrl || 'assets/no-poster.png'"
            class="w-16 h-24 object-cover rounded-lg"
          />
          <div class="flex-1 ml-3">
            <p class="font-semibold text-sm">{{ item.content?.title }}</p>
            <p *ngIf="item.episodeId" class="text-xs text-gray-400 mt-0.5">Epizod korildi</p>
            <div class="progress-wrap mt-2">
              <div class="progress-bar" [style.width]="getProgress(item) + '%'"></div>
            </div>
            <p class="text-xs text-gray-400 mt-1">{{ getProgress(item) }}% korildi</p>
          </div>
          <div class="ml-2 text-gray-400">
            <span *ngIf="item.isCompleted" class="text-green-400 text-lg">&#10003;</span>
            <span *ngIf="!item.isCompleted" class="text-gray-500 text-sm">&#9654;</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .history-item {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
      }
      .progress-wrap {
        height: 3px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        width: 100%;
      }
      .progress-bar {
        height: 100%;
        background: var(--accent);
        border-radius: 2px;
        transition: width 0.3s;
      }
      .page-title {
        font-size: 1.25rem;
        font-weight: 700;
      }
    `,
  ],
})
export class HistoryComponent implements OnInit {
  items: any[] = [];
  loading = true;

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.api.getHistory().subscribe({
      next: (r: any) => {
        this.items = r.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  getProgress(item: any): number {
    if (!item.durationSeconds) return 0;
    return Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100));
  }

  open(item: any) {
    if (!item.content) return;
    const commands = ['/watch', item.content.id];
    const extras = item.episodeId ? { queryParams: { ep: item.episodeId } } : {};
    this.router.navigate(commands, extras);
  }
}
