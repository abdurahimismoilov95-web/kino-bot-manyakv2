import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { DialogService } from '../../../core/services/dialog.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-payments',
  template: `
    <div class="pw">
      <div *ngIf="!isSuper" class="lock">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
        <p class="lock-t">Ruxsat yoq</p>
        <p class="lock-s">Tolov cheklarini faqat bosh admin kora oladi va tasdiqlaydi.</p>
      </div>

      <ng-container *ngIf="isSuper">
        <div class="tabs">
          <button class="tab-btn" [class.active]="tab === 'pending'" (click)="setTab('pending')">Kutilayotgan</button>
          <button class="tab-btn" [class.active]="tab === 'history'" (click)="setTab('history')">Barcha</button>
        </div>

        <div *ngIf="loading" class="muted center">Yuklanmoqda...</div>
        <div *ngIf="errorText && !loading" class="err">{{ errorText }}</div>

        <div *ngIf="!loading && !errorText && receipts.length === 0" class="empty">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          <p class="muted">{{ emptyLabel }}</p>
        </div>

        <div *ngFor="let r of receipts" [class]="'receipt-card status-' + r.status">
          <div class="row">
            <button type="button" class="thumb" (click)="open(r)">
              <img *ngIf="!r._imgErr && imgOf(r)" [src]="imgOf(r)" class="receipt-img" (error)="r._imgErr = true" />
              <div *ngIf="r._imgErr || !imgOf(r)" class="noimg">Rasm<br />yoq</div>
            </button>
            <div class="info">
              <div class="top">
                <div>
                  <p class="pl">{{ r.contentTitle || r.planName || 'Nomalum reja' }}</p>
                  <p class="amount">{{ r.amount | number }} som</p>
                </div>
                <span [class]="'status-badge ' + r.status">{{ statusLabel(r.status) }}</span>
              </div>
              <p class="sm">{{ r.createdAt | date: 'dd.MM.yyyy HH:mm' }}</p>
              <p class="sm">{{ userName(r) }}</p>
              <p class="xs">ID: {{ r.userId }}</p>
              <p class="xs" *ngIf="r.promoCode">Promo: {{ r.promoCode }} (-{{ r.discountPercent }}%)</p>
            </div>
          </div>

          <div *ngIf="r.status === 'pending'" class="actions-row">
            <button class="action-btn view" (click)="open(r)">Chekni korish</button>
            <button class="action-btn approve" (click)="approve(r)" [disabled]="r._loading">{{ r._loading ? '...' : 'Tasdiqlash' }}</button>
            <button class="action-btn reject" (click)="reject(r)" [disabled]="r._loading">Rad etish</button>
          </div>

          <p *ngIf="r.status === 'rejected' && r.rejectReason" class="reason">Sabab: {{ r.rejectReason }}</p>
        </div>

        <div class="pager" *ngIf="totalPages > 1">
          <button class="btn-xs" [disabled]="page <= 1" (click)="prevPage()">Oldingi</button>
          <span class="muted">{{ page }} / {{ totalPages }}</span>
          <button class="btn-xs" [disabled]="page >= totalPages" (click)="nextPage()">Keyingi</button>
        </div>
      </ng-container>

      <div class="lb" *ngIf="preview" (click)="closePreview()">
        <div class="lb-box" (click)="$event.stopPropagation()">
          <div class="lb-hd">
            <span class="lb-t">{{ previewTitle }}</span>
            <button class="lb-x" (click)="closePreview()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>
          <div class="lb-body">
            <img *ngIf="!previewErr" [src]="preview" (error)="previewErr = true" />
            <div *ngIf="previewErr" class="lb-err">Chek rasmi topilmadi. Server qayta ishga tushganda fayl ochib ketgan bolishi mumkin. Foydalanuvchidan chekni qayta yuborishni soʻrang.</div>
          </div>
          <div class="lb-act" *ngIf="previewReceipt && previewReceipt.status === 'pending'">
            <button class="action-btn approve" (click)="approve(previewReceipt)">Tasdiqlash</button>
            <button class="action-btn reject" (click)="reject(previewReceipt)">Rad etish</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pw { padding: 16px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 14px; }
    .tab-btn { padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: rgba(255,255,255,0.55); font-size: 0.85rem; font-weight: 700; cursor: pointer; }
    .tab-btn.active { background: #dc2626; color: #fff; border-color: #dc2626; }
    .muted { color: #a1a1aa; font-size: 0.85rem; }
    .center { text-align: center; padding: 24px 0; }
    .err { background: rgba(220,38,38,0.12); border: 1px solid rgba(220,38,38,0.4); color: #fca5a5; padding: 12px; border-radius: 12px; font-size: 0.85rem; margin-bottom: 10px; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px 0; }
    .lock { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 60px 20px; }
    .lock-t { margin: 0; font-weight: 900; font-size: 1.05rem; }
    .lock-s { margin: 0; color: #a1a1aa; font-size: 0.85rem; max-width: 280px; }
    .receipt-card { background: #18181b; border-radius: 14px; padding: 12px; margin-bottom: 10px; border: 1px solid #27272a; }
    .receipt-card.status-approved { border-color: rgba(34,197,94,0.3); }
    .receipt-card.status-rejected { border-color: rgba(239,68,68,0.25); opacity: 0.75; }
    .row { display: flex; gap: 12px; }
    .thumb { padding: 0; border: none; background: none; cursor: pointer; flex: 0 0 auto; }
    .receipt-img { width: 72px; height: 96px; object-fit: cover; border-radius: 10px; border: 1px solid #3f3f46; display: block; background: #09090b; }
    .noimg { width: 72px; height: 96px; border-radius: 10px; border: 1px dashed #3f3f46; color: #71717a; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; text-align: center; }
    .info { flex: 1; min-width: 0; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .pl { margin: 0; font-weight: 800; font-size: 0.9rem; }
    .amount { margin: 2px 0 0; font-size: 0.95rem; font-weight: 900; color: #f59e0b; }
    .sm { margin: 4px 0 0; font-size: 0.75rem; color: #d4d4d8; }
    .xs { margin: 2px 0 0; font-size: 0.7rem; color: #71717a; }
    .status-badge { font-size: 0.68rem; padding: 3px 8px; border-radius: 6px; font-weight: 800; white-space: nowrap; }
    .status-badge.pending { background: rgba(251,191,36,0.18); color: #fbbf24; }
    .status-badge.approved { background: rgba(34,197,94,0.18); color: #22c55e; }
    .status-badge.rejected { background: rgba(239,68,68,0.18); color: #ef4444; }
    .actions-row { display: flex; gap: 6px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #27272a; }
    .action-btn { flex: 1; padding: 10px 6px; border-radius: 10px; border: none; font-size: 0.8rem; font-weight: 800; cursor: pointer; }
    .action-btn:disabled { opacity: 0.5; }
    .view { background: #27272a; color: #e4e4e7; }
    .approve { background: rgba(34,197,94,0.2); color: #22c55e; }
    .reject { background: rgba(239,68,68,0.2); color: #ef4444; }
    .reason { margin: 8px 0 0; font-size: 0.75rem; color: #f87171; }
    .pager { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
    .btn-xs { padding: 7px 14px; border-radius: 8px; border: none; font-size: 0.8rem; background: #27272a; color: #d4d4d8; cursor: pointer; }
    .btn-xs:disabled { opacity: 0.4; }
    .lb { position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,0.88); display: flex; align-items: center; justify-content: center; padding: 14px; }
    .lb-box { width: 100%; max-width: 520px; max-height: 92dvh; display: flex; flex-direction: column; background: #18181b; border: 1px solid #3f3f46; border-radius: 16px; overflow: hidden; }
    .lb-hd { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid #27272a; }
    .lb-t { font-weight: 800; font-size: 0.9rem; }
    .lb-x { background: #27272a; border: none; color: #fff; width: 32px; height: 32px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
    .lb-body { flex: 1; overflow: auto; background: #09090b; display: flex; align-items: center; justify-content: center; min-height: 200px; }
    .lb-body img { max-width: 100%; max-height: 72dvh; object-fit: contain; display: block; }
    .lb-err { color: #fca5a5; font-size: 0.85rem; padding: 24px; text-align: center; line-height: 1.5; }
    .lb-act { display: flex; gap: 8px; padding: 10px 12px; border-top: 1px solid #27272a; }
  `],
})
export class AdminPaymentsComponent implements OnInit {
  receipts: any[] = [];
  loading = false;
  errorText = '';
  tab: 'pending' | 'history' = 'pending';
  page = 1;
  totalPages = 1;

  preview: string | null = null;
  previewErr = false;
  previewTitle = '';
  previewReceipt: any = null;

  constructor(private api: ApiService, private dlg: DialogService, private auth: AuthService) {}

  get isSuper(): boolean {
    const u = this.auth.currentUser;
    return !!u && u.role === 'super_admin';
  }

  get emptyLabel(): string {
    return this.tab === 'pending' ? 'Kutilayotgan tolov yoq' : 'Tolov tarixi bosh';
  }

  ngOnInit() {
    if (this.isSuper) { this.load(); }
  }

  /** Nisbiy yo'lni (/uploads/...) API manziliga aylantiradi */
  imgOf(r: any): string {
    const u = r && typeof r.imageUrl === 'string' ? r.imageUrl.trim() : '';
    if (!u) { return ''; }
    if (/^(https?:|data:|blob:)/i.test(u)) { return u; }
    const origin = String(environment.apiUrl || '').replace(/\/api\/v1\/?$/, '');
    return origin + (u.charAt(0) === '/' ? u : '/' + u);
  }

  userName(r: any): string {
    const u = r && r.user;
    if (!u) { return ''; }
    const n = [u.firstName, u.lastName].filter((x: any) => !!x).join(' ');
    const un = u.username ? ' @' + u.username : '';
    const ph = u.phoneNumber ? ' | ' + u.phoneNumber : '';
    return (n || 'Foydalanuvchi') + un + ph;
  }

  open(r: any): void {
    this.previewReceipt = r;
    this.previewErr = !this.imgOf(r);
    this.preview = this.imgOf(r) || 'about:blank';
    this.previewTitle = (r.contentTitle || r.planName || 'Chek') + ' - ' + (r.amount || 0) + ' som';
  }

  closePreview(): void {
    this.preview = null;
    this.previewReceipt = null;
    this.previewErr = false;
  }

  setTab(t: 'pending' | 'history') {
    this.tab = t;
    this.page = 1;
    this.load();
  }

  load() {
    this.loading = true;
    this.errorText = '';
    const req = this.tab === 'pending' ? this.api.getPendingReceipts(this.page) : this.api.getAllReceipts(this.page);
    req.subscribe({
      next: (r: any) => {
        this.receipts = (r && r.data) || [];
        this.totalPages = (r && r.totalPages) || 1;
        this.loading = false;
      },
      error: (e: any) => {
        this.loading = false;
        this.receipts = [];
        this.errorText = e && e.status === 403
          ? 'Tolov cheklari faqat bosh admin uchun.'
          : 'Cheklarni yuklab bolmadi. Qayta urinib koring.';
      },
    });
  }

  approve(r: any) {
    const label = (r.contentTitle || r.planName || 'Tolov') + ' - ' + (r.amount || 0) + ' som';
    this.dlg.confirm(label + '. Chek tasdiqlansinmi?', { title: 'Tolovni tasdiqlash', okText: 'Tasdiqlash' }).then((ok) => {
      if (!ok) { return; }
      r._loading = true;
      this.api.approveReceipt(r.id).subscribe({
        next: (updated: any) => {
          Object.assign(r, updated);
          r._loading = false;
          this.closePreview();
        },
        error: () => {
          r._loading = false;
          this.dlg.alert('Tasdiqlab bolmadi. Qayta urinib koring.', 'Xato');
        },
      });
    });
  }

  reject(r: any) {
    this.dlg.prompt('Rad etish sababini yozing:', '', { title: 'Chekni rad etish', okText: 'Rad etish', danger: true, placeholder: 'Masalan: chek notogri' }).then((reason) => {
      if (!reason || !reason.trim()) { return; }
      r._loading = true;
      this.api.rejectReceipt(r.id, reason.trim()).subscribe({
        next: (updated: any) => {
          Object.assign(r, updated);
          r._loading = false;
          this.closePreview();
        },
        error: () => {
          r._loading = false;
          this.dlg.alert('Rad etib bolmadi. Qayta urinib koring.', 'Xato');
        },
      });
    });
  }

  statusLabel(s: string) {
    if (s === 'pending') return 'Kutilmoqda';
    if (s === 'approved') return 'Tasdiqlangan';
    return 'Rad etilgan';
  }

  prevPage() {
    if (this.page > 1) { this.page--; this.load(); }
  }

  nextPage() {
    if (this.page < this.totalPages) { this.page++; this.load(); }
  }
}
