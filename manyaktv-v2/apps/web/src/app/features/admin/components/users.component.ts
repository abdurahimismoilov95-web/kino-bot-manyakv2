import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-admin-users',
  template: `
    <div class="wrap">
      <div class="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input
          class="admin-input"
          type="text"
          placeholder="Ism, username, ID, telefon..."
          [(ngModel)]="query"
          [ngModelOptions]="{ standalone: true }"
          (ngModelChange)="search$.next($event)"
        />
      </div>

      <div *ngIf="loading" class="muted center">Yuklanmoqda...</div>
      <div *ngIf="!loading && users.length === 0" class="muted center">Foydalanuvchi topilmadi</div>

      <div *ngFor="let u of users" class="user-card" [class.banned]="u.isBanned">
        <div class="top">
          <div class="avatar">{{ u.firstName ? u.firstName.charAt(0) : '?' }}</div>
          <div class="info">
            <div class="name-row">
              <p class="name">{{ u.firstName }} {{ u.lastName }}</p>
              <span *ngIf="u.isVip" class="badge-small vip">VIP</span>
              <span *ngIf="u.isBanned" class="badge-small ban">BAN</span>
              <span *ngIf="u.role === 'admin' || u.role === 'super_admin'" class="badge-small admin">ADMIN</span>
            </div>
            <p class="sub">{{ u.username ? ('@' + u.username) : ('ID ' + u.telegramId) }}</p>
            <p class="sub2">Tel: {{ u.phoneNumber || 'tasdiqlanmagan' }} &middot; ID: {{ u.telegramId || u.id }}</p>
          </div>
        </div>

        <div class="actions">
          <button *ngIf="!u.isVip" class="btn-xs success" (click)="grantVip(u)">+ VIP</button>
          <button *ngIf="u.isVip" class="btn-xs warning" (click)="revokeVip(u)">VIP olish</button>
          <button *ngIf="!u.isBanned" class="btn-xs danger" (click)="ban(u)">Bloklash</button>
          <button *ngIf="u.isBanned" class="btn-xs neutral" (click)="unban(u)">Blokdan chiqarish</button>
          <button class="btn-xs neutral" (click)="resetHwid(u)">HWID reset</button>
        </div>
      </div>

      <div class="pager" *ngIf="totalPages > 1">
        <button class="btn-xs neutral" [disabled]="page <= 1" (click)="prevPage()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          <span>Oldingi</span>
        </button>
        <span class="muted">{{ page }} / {{ totalPages }}</span>
        <button class="btn-xs neutral" [disabled]="page >= totalPages" (click)="nextPage()">
          <span>Keyingi</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .wrap { padding: 16px; color: #fff; }
      .search { position: relative; margin-bottom: 14px; color: #71717a; }
      .search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); }
      .admin-input { width: 100%; background: #18181b; border: 1px solid #3f3f46; border-radius: 10px; padding: 11px 14px 11px 36px; color: #fff; font-size: 0.9rem; outline: none; box-sizing: border-box; }
      .muted { color: #a1a1aa; font-size: 0.85rem; }
      .center { text-align: center; padding: 24px 0; }
      .user-card { background: #18181b; border-radius: 12px; padding: 14px; margin-bottom: 10px; border: 1px solid #27272a; }
      .user-card.banned { border-color: rgba(239, 68, 68, 0.35); background: rgba(239, 68, 68, 0.06); }
      .top { display: flex; align-items: center; gap: 12px; }
      .info { flex: 1; min-width: 0; }
      .name-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .name { margin: 0; font-weight: 700; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
      .sub { margin: 3px 0 0; font-size: 0.75rem; color: #a1a1aa; }
      .sub2 { margin: 2px 0 0; font-size: 0.72rem; color: #71717a; word-break: break-all; }
      .avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #dc2626, #7f1d1d); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.1rem; flex-shrink: 0; text-transform: uppercase; }
      .badge-small { font-size: 0.62rem; padding: 2px 6px; border-radius: 4px; font-weight: 800; }
      .vip { background: rgba(245, 158, 11, 0.18); color: #fbbf24; }
      .ban { background: rgba(239, 68, 68, 0.2); color: #f87171; }
      .admin { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
      .actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; border-top: 1px solid #27272a; padding-top: 10px; }
      .btn-xs { display: inline-flex; align-items: center; gap: 4px; padding: 7px 12px; border-radius: 8px; border: none; font-size: 0.75rem; font-weight: 700; cursor: pointer; line-height: 1; }
      .btn-xs:disabled { opacity: 0.4; cursor: default; }
      .success { background: rgba(34, 197, 94, 0.18); color: #34d399; }
      .warning { background: rgba(251, 191, 36, 0.18); color: #fbbf24; }
      .danger { background: rgba(239, 68, 68, 0.18); color: #f87171; }
      .neutral { background: #27272a; color: #d4d4d8; }
      .pager { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
    `,
  ],
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  users: any[] = [];
  loading = false;
  query = '';
  page = 1;
  limit = 15;
  totalPages = 1;
  search$ = new Subject<string>();
  private sub?: Subscription;

  constructor(private api: ApiService, private dlg: DialogService) {}

  ngOnInit() {
    this.sub = this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.page = 1;
      this.load();
    });
    this.load();
  }

  ngOnDestroy() {
    if (this.sub) { this.sub.unsubscribe(); }
  }

  private nameOf(u: any): string {
    return (u.firstName || u.username || String(u.telegramId || u.id || '')).trim();
  }

  private fail(): void {
    this.dlg.alert('Amal bajarilmadi. Qayta urinib koring.', 'Xato');
  }

  load() {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit };
    if (this.query.trim()) params.search = this.query.trim();
    this.api.getUsers(params).subscribe({
      next: (r: any) => {
        this.users = (r && r.data) || [];
        this.totalPages = (r && r.totalPages) || 1;
        this.loading = false;
      },
      error: () => { this.loading = false; this.users = []; },
    });
  }

  grantVip(u: any) {
    this.dlg.prompt(this.nameOf(u) + ' ga necha kun VIP berilsin?', '30', { title: 'VIP berish', okText: 'Berish', inputType: 'number' }).then((days) => {
      if (!days || isNaN(+days) || +days <= 0) { return; }
      this.api.grantVip(u.id, +days).subscribe({
        next: (updated: any) => { Object.assign(u, updated); },
        error: () => this.fail(),
      });
    });
  }

  revokeVip(u: any) {
    this.dlg.confirm(this.nameOf(u) + ' dan VIP olinsinmi?', { title: 'VIP ni olish', okText: 'Olish', danger: true }).then((ok) => {
      if (!ok) { return; }
      this.api.revokeVip(u.id).subscribe({
        next: (updated: any) => { Object.assign(u, updated); },
        error: () => this.fail(),
      });
    });
  }

  ban(u: any) {
    this.dlg.prompt(this.nameOf(u) + ' bloklanadi. Sababini yozing:', '', { title: 'Foydalanuvchini bloklash', okText: 'Bloklash', danger: true, placeholder: 'Ban sababi' }).then((reason) => {
      if (!reason || !reason.trim()) { return; }
      this.api.banUser(u.id, reason.trim()).subscribe({
        next: (updated: any) => { Object.assign(u, updated); },
        error: () => this.fail(),
      });
    });
  }

  unban(u: any) {
    this.dlg.confirm(this.nameOf(u) + ' blokdan chiqarilsinmi?', { title: 'Blokdan chiqarish', okText: 'Chiqarish' }).then((ok) => {
      if (!ok) { return; }
      this.api.unbanUser(u.id).subscribe({
        next: (updated: any) => { Object.assign(u, updated); },
        error: () => this.fail(),
      });
    });
  }

  resetHwid(u: any) {
    this.dlg.confirm(this.nameOf(u) + ' qurilma boglanishi bekor qilinsinmi?', { title: 'HWID reset', okText: 'Reset', danger: true }).then((ok) => {
      if (!ok) { return; }
      this.api.resetHwid(u.id).subscribe({
        next: () => { this.dlg.alert('HWID ochirildi', 'Tayyor'); },
        error: () => this.fail(),
      });
    });
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
