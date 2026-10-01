import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="db">
      <app-admin-stats></app-admin-stats>

      <div class="grid">
        <div class="stat-card" *ngFor="let s of stats">
          <p class="sv" [ngClass]="s.color">{{ s.value }}</p>
          <p class="sl">{{ s.label }}</p>
        </div>
      </div>

      <div class="section-card" *ngIf="isSuper">
        <h3 class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 10h6M9 14h6M9 18h3"/></svg>
          <span>Kutilayotgan tolovlar</span>
        </h3>
        <div *ngIf="pendingLoading" class="muted center">Yuklanmoqda...</div>
        <div *ngIf="!pendingLoading && !pendingPayments.length" class="muted center">Kutilayotgan tolov yoq</div>
        <div *ngFor="let r of pendingPayments" class="pending-item">
          <div class="pi">
            <p class="pt">{{ r.planName || r.contentTitle || 'Nomalum reja' }}</p>
            <p class="ps">{{ r.amount | number }} som &middot; {{ r.createdAt | date: 'dd.MM HH:mm' }}</p>
          </div>
          <div class="btns">
            <button class="action-btn approve" title="Tasdiqlash" (click)="approve(r)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </button>
            <button class="action-btn reject" title="Rad etish" (click)="promptReject(r)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <button *ngIf="pendingTotal > 5" class="link-btn" routerLink="../payments">
          <span>Barchasini korish ({{ pendingTotal }})</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .db { padding: 16px; color: #fff; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 16px; }
      @media (min-width: 720px) { .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
      .stat-card { background: #18181b; border-radius: 14px; padding: 14px; border: 1px solid #27272a; }
      .sv { margin: 0; font-size: 1.4rem; font-weight: 900; }
      .sl { margin: 4px 0 0; font-size: 0.72rem; color: #a1a1aa; }
      .c-blue { color: #60a5fa; }
      .c-amber { color: #fbbf24; }
      .c-gray { color: #d4d4d8; }
      .c-red { color: #f87171; }
      .section-card { background: #18181b; border-radius: 14px; padding: 14px; border: 1px solid #27272a; }
      .section-title { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; font-weight: 800; color: #fff; margin: 0 0 10px; }
      .muted { color: #a1a1aa; font-size: 0.82rem; }
      .center { text-align: center; padding: 14px 0; }
      .pending-item { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #27272a; }
      .pi { min-width: 0; }
      .pt { margin: 0; font-size: 0.85rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ps { margin: 3px 0 0; font-size: 0.72rem; color: #a1a1aa; }
      .btns { display: flex; gap: 6px; flex: 0 0 auto; }
      .action-btn { width: 34px; height: 34px; border-radius: 9px; border: none; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
      .approve { background: rgba(34, 197, 94, 0.18); color: #34d399; }
      .reject { background: rgba(239, 68, 68, 0.18); color: #f87171; }
      .link-btn { display: inline-flex; align-items: center; gap: 4px; margin-top: 12px; background: none; border: none; color: #f87171; font-size: 0.82rem; font-weight: 700; cursor: pointer; padding: 0; }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit {
  stats: Array<{ label: string; value: number; color: string }> = [];
  pendingPayments: any[] = [];
  pendingTotal = 0;
  pendingLoading = true;

  constructor(private api: ApiService, private auth: AuthService, private dlg: DialogService) {}

  get isSuper(): boolean {
    const u: any = this.auth.currentUser;
    return !!u && u.role === 'super_admin';
  }

  ngOnInit() {
    this.loadDashboard();
    if (this.isSuper) { this.loadPending(); } else { this.pendingLoading = false; }
  }

  loadDashboard() {
    this.api.getAdminDashboard().subscribe({
      next: (r: any) => {
        const u = (r && r.users) || {};
        this.stats = [
          { label: 'Jami foydalanuvchi', value: u.total || 0, color: 'c-blue' },
          { label: 'VIP obunachi', value: u.vip || 0, color: 'c-amber' },
          { label: 'Bepul foydalanuvchi', value: u.free || 0, color: 'c-gray' },
          { label: 'Bloklangan', value: u.banned || 0, color: 'c-red' },
        ];
      },
      error: () => { this.stats = []; },
    });
  }

  loadPending() {
    this.pendingLoading = true;
    this.api.getPendingReceipts().subscribe({
      next: (r: any) => {
        this.pendingPayments = ((r && r.data) || []).slice(0, 5);
        this.pendingTotal = (r && r.total) || 0;
        this.pendingLoading = false;
      },
      error: () => { this.pendingLoading = false; },
    });
  }

  private drop(id: string): void {
    this.pendingPayments = this.pendingPayments.filter((x) => x.id !== id);
    this.pendingTotal = Math.max(0, this.pendingTotal - 1);
  }

  approve(r: any) {
    const label = (r.planName || r.contentTitle || 'Tolov') + ' - ' + (r.amount || 0) + ' som';
    this.dlg.confirm(label + '. Chek tasdiqlansinmi?', { title: 'Tolovni tasdiqlash', okText: 'Tasdiqlash' }).then((ok) => {
      if (!ok) { return; }
      this.api.approveReceipt(r.id).subscribe({
        next: () => this.drop(r.id),
        error: () => this.dlg.alert('Tasdiqlab bolmadi. Qayta urinib koring.', 'Xato'),
      });
    });
  }

  promptReject(r: any) {
    this.dlg.prompt('Rad etish sababini yozing:', '', { title: 'Chekni rad etish', okText: 'Rad etish', danger: true, placeholder: 'Masalan: chek notogri' }).then((reason) => {
      if (!reason || !reason.trim()) { return; }
      this.api.rejectReceipt(r.id, reason.trim()).subscribe({
        next: () => this.drop(r.id),
        error: () => this.dlg.alert('Rad etib bolmadi. Qayta urinib koring.', 'Xato'),
      });
    });
  }
}
