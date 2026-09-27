import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="px-4 pt-5">
      <!-- Stats cards -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="stat-card" *ngFor="let s of stats">
          <p class="text-2xl font-bold" [class]="s.color">{{ s.value }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ s.label }}</p>
        </div>
      </div>

      <!-- Pending payments -->
      <div class="section-card">
        <h3 class="section-title">&#128203; Kutilayotgan to'lovlar</h3>
        <div *ngIf="pendingLoading" class="text-center py-4 text-gray-400 text-sm">Yuklanmoqda...</div>
        <div *ngIf="!pendingLoading && !pendingPayments.length" class="text-center py-4 text-gray-400 text-sm">
          Kutilayotgan to'lov yo'q &#127881;
        </div>
        <div *ngFor="let r of pendingPayments" class="pending-item">
          <div>
            <p class="text-sm font-semibold">{{ r.planName || 'Noma\'lum reja' }}</p>
            <p class="text-xs text-gray-400">{{ r.amount | number }} so'm &bull; {{ r.createdAt | date:'dd.MM HH:mm' }}</p>
          </div>
          <div class="flex gap-2">
            <button class="action-btn approve" (click)="approve(r.id)">&#10003;</button>
            <button class="action-btn reject" (click)="promptReject(r)">&#10005;</button>
          </div>
        </div>
        <button *ngIf="pendingTotal > 5" class="text-[var(--accent)] text-sm mt-3" routerLink="../payments">
          Barchasini ko'rish ({{ pendingTotal }}) &rsaquo;
        </button>
      </div>

      <!-- Broadcast -->
      <div class="section-card mt-4">
        <h3 class="section-title">&#128227; Broadcast xabar</h3>
        <input class="admin-input" type="text" placeholder="Xabar matni..." [(ngModel)]="broadcastMsg" />
        <button class="btn-primary w-full mt-2" (click)="broadcast()" [disabled]="!broadcastMsg.trim() || broadcasting">
          {{ broadcasting ? 'Yuborilmoqda...' : 'Barcha foydalanuvchilarga yuborish' }}
        </button>
        <p *ngIf="broadcastDone" class="text-green-400 text-sm mt-2 text-center">&#10003; Yuborildi!</p>
      </div>
    </div>
  `,
  styles: [`
    .stat-card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.08); }
    .section-card { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.06); }
    .section-title { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.7); margin-bottom: 12px; }
    .pending-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .action-btn { width: 32px; height: 32px; border-radius: 8px; border: none; font-size: 1rem; cursor: pointer; }
    .approve { background: rgba(34,197,94,0.2); color: #22c55e; }
    .reject  { background: rgba(239,68,68,0.2); color: #ef4444; }
    .admin-input { width: 100%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; color: #fff; font-size: 0.9rem; outline: none; box-sizing: border-box; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: any[] = [];
  pendingPayments: any[] = [];
  pendingTotal = 0;
  pendingLoading = true;
  broadcastMsg = '';
  broadcasting = false;
  broadcastDone = false;

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadDashboard(); this.loadPending(); }

  loadDashboard() {
    this.api.getAdminDashboard().subscribe({
      next: (r: any) => {
        this.stats = [
          { label: 'Jami foydalanuvchi', value: r.users.total, color: 'text-blue-400' },
          { label: 'VIP obunachi',        value: r.users.vip,   color: 'text-yellow-400' },
          { label: 'Bepul foydalanuvchi', value: r.users.free,  color: 'text-gray-300' },
          { label: 'Bloklangan',          value: r.users.banned, color: 'text-red-400' },
        ];
      },
    });
  }

  loadPending() {
    this.pendingLoading = true;
    this.api.getPendingReceipts().subscribe({
      next: (r: any) => {
        this.pendingPayments = r.data.slice(0, 5);
        this.pendingTotal = r.total;
        this.pendingLoading = false;
      },
      error: () => (this.pendingLoading = false),
    });
  }

  approve(id: string) {
    this.api.approveReceipt(id).subscribe({
      next: () => { this.pendingPayments = this.pendingPayments.filter((r) => r.id !== id); this.pendingTotal--; },
    });
  }

  promptReject(receipt: any) {
    const reason = prompt('Rad etish sababi:');
    if (!reason) return;
    this.api.rejectReceipt(receipt.id, reason).subscribe({
      next: () => { this.pendingPayments = this.pendingPayments.filter((r) => r.id !== receipt.id); this.pendingTotal--; },
    });
  }

  broadcast() {
    if (!this.broadcastMsg.trim()) return;
    this.broadcasting = true;
    this.api.adminBroadcast('admin.notice', this.broadcastMsg.trim()).subscribe({
      next: () => { this.broadcasting = false; this.broadcastDone = true; this.broadcastMsg = ''; setTimeout(() => (this.broadcastDone = false), 3000); },
      error: () => (this.broadcasting = false),
    });
  }
}
