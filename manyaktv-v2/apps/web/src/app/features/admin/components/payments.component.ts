import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-payments',
  template: `
    <div class="px-4 pt-4">
      <div class="flex gap-2 mb-4">
        <button class="tab-btn" [class.active]="tab === 'pending'" (click)="setTab('pending')">
          Kutilayotgan
        </button>
        <button class="tab-btn" [class.active]="tab === 'history'" (click)="setTab('history')">
          Barcha
        </button>
      </div>

      <div *ngIf="loading" class="text-center py-6 text-gray-400">Yuklanmoqda...</div>

      <div *ngIf="!loading && receipts.length === 0" class="text-center py-12">
        <p class="text-3xl mb-2">&#10003;</p>
        <p class="text-gray-400 text-sm">{{ emptyLabel }}</p>
      </div>

      <div *ngFor="let r of receipts" class="receipt-card" [class]="'receipt-card status-' + r.status">
        <div class="flex gap-3">
          <a [href]="r.imageUrl" target="_blank" class="block">
            <img [src]="r.imageUrl" class="receipt-img" />
          </a>
          <div class="flex-1">
            <div class="flex items-start justify-between">
              <div>
                <p class="font-semibold text-sm">{{ r.planName || 'Nomalum reja' }}</p>
                <p class="amount">{{ r.amount | number }} som</p>
                <p class="text-xs text-gray-400 mt-1">
                  {{ r.createdAt | date: 'dd.MM.yyyy HH:mm' }}
                </p>
                <p class="text-xs text-gray-500">ID: {{ r.userId }}</p>
              </div>
              <span class="status-badge" [class]="'status-badge ' + r.status">{{
                statusLabel(r.status)
              }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="r.status === 'pending'" class="actions-row">
          <button class="action-btn approve flex-1" (click)="approve(r)" [disabled]="r._loading">
            {{ r._loading ? '...' : 'Tasdiqlash' }}
          </button>
          <button class="action-btn reject flex-1" (click)="reject(r)" [disabled]="r._loading">
            Rad etish
          </button>
        </div>

        <p *ngIf="r.status === 'rejected' && r.rejectReason" class="text-xs text-red-400 mt-2">
          Sabab: {{ r.rejectReason }}
        </p>
      </div>

      <div class="flex justify-between mt-4" *ngIf="totalPages > 1">
        <button class="btn-xs neutral" [disabled]="page <= 1" (click)="prevPage()">
          &#8592; Oldingi
        </button>
        <span class="text-sm text-gray-400">{{ page }} / {{ totalPages }}</span>
        <button class="btn-xs neutral" [disabled]="page >= totalPages" (click)="nextPage()">
          Keyingi &#8594;
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .tab-btn {
        padding: 8px 16px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: transparent;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .tab-btn.active {
        background: var(--accent, #e50914);
        color: #fff;
        border-color: var(--accent, #e50914);
      }
      .receipt-card {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 10px;
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
      .receipt-card.status-approved {
        border-color: rgba(34, 197, 94, 0.25);
      }
      .receipt-card.status-rejected {
        border-color: rgba(239, 68, 68, 0.2);
        opacity: 0.7;
      }
      .receipt-img {
        width: 64px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .amount {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--accent, #e50914);
        margin-top: 2px;
      }
      .status-badge {
        font-size: 0.7rem;
        padding: 3px 8px;
        border-radius: 6px;
        font-weight: 700;
      }
      .status-badge.pending {
        background: rgba(251, 191, 36, 0.2);
        color: #fbbf24;
      }
      .status-badge.approved {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }
      .status-badge.rejected {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
      .actions-row {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }
      .action-btn {
        padding: 10px;
        border-radius: 10px;
        border: none;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
      }
      .approve {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }
      .reject {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
      .btn-xs {
        padding: 6px 14px;
        border-radius: 8px;
        border: none;
        font-size: 0.8rem;
        cursor: pointer;
      }
      .neutral {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
      }
    `,
  ],
})
export class AdminPaymentsComponent implements OnInit {
  receipts: any[] = [];
  loading = false;
  tab: 'pending' | 'history' = 'pending';
  page = 1;
  limit = 20;
  totalPages = 1;

  constructor(private api: ApiService) {}

  get emptyLabel(): string {
    return this.tab === 'pending' ? 'Kutilayotgan tolov yoq' : 'Tolov tarixi bosh';
  }

  ngOnInit() {
    this.load();
  }

  setTab(t: 'pending' | 'history') {
    this.tab = t;
    this.page = 1;
    this.load();
  }

  load() {
    this.loading = true;
    if (this.tab === 'pending') {
      (this.api.getPendingReceipts(this.page) as any).subscribe({
        next: (r: any) => {
          this.receipts = r.data;
          this.totalPages = r.totalPages;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    } else {
      (this.api.getMyReceipts() as any).subscribe({
        next: (r: any) => {
          this.receipts = Array.isArray(r) ? r : r.data || [];
          this.totalPages = 1;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    }
  }

  approve(r: any) {
    r._loading = true;
    this.api.approveReceipt(r.id).subscribe({
      next: (updated: any) => {
        Object.assign(r, updated);
        r._loading = false;
      },
      error: () => (r._loading = false),
    });
  }

  reject(r: any) {
    const reason = prompt('Rad etish sababi:');
    if (!reason) return;
    r._loading = true;
    this.api.rejectReceipt(r.id, reason).subscribe({
      next: (updated: any) => {
        Object.assign(r, updated);
        r._loading = false;
      },
      error: () => (r._loading = false),
    });
  }

  statusLabel(s: string) {
    if (s === 'pending') return 'Kutilmoqda';
    if (s === 'approved') return 'Tasdiqlangan';
    return 'Rad etilgan';
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }
}
