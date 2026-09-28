import { Component, OnInit } from '@angular/core';
import { AdminApiService } from './admin-api.service';

/** v1 AdminPanel -> "Adminlar" bolimi (faqat super admin). */
@Component({
  selector: 'app-admin-admins',
  template: `
    <div class="ap">
      <h2>Adminlar</h2>
      <p class="hint">Telegram ID orqali admin qoshing yoki olib tashlang.</p>

      <div class="form">
        <input class="in" [(ngModel)]="newId" [ngModelOptions]="{ standalone: true }" placeholder="Telegram ID (891846690)" />
        <button class="b b-red wide" [disabled]="saving" (click)="add()">
          {{ saving ? 'Qoshilmoqda...' : 'Admin qoshish' }}
        </button>
      </div>

      <p class="ap-err" *ngIf="error">{{ error }}</p>
      <p class="ap-ok" *ngIf="okMsg">{{ okMsg }}</p>
      <p class="ap-muted" *ngIf="loading">Yuklanmoqda...</p>

      <div class="row" *ngFor="let a of admins">
        <div>
          <p class="r-n">{{ a.firstName || a.name || 'Admin' }}</p>
          <p class="r-i">ID: {{ a.telegramId || a.id }} &middot; {{ a.role || 'admin' }}</p>
        </div>
        <button class="b b-d" *ngIf="a.role !== 'super_admin'" (click)="remove(a)">&#10005;</button>
      </div>

      <p class="ap-muted" *ngIf="!loading && admins.length === 0">Adminlar royxati bosh.</p>
    </div>
  `,
  styles: [`
    .ap { padding: 16px; color: #fff; }
    h2 { font-size: 1rem; font-weight: 800; margin: 0; }
    .hint { font-size: 0.72rem; color: #a1a1aa; margin: 6px 0 14px; }
    .form, .row { background: #18181b; border: 1px solid #27272a; border-radius: 13px; padding: 13px; margin-bottom: 10px; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .in { width: 100%; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 10px; padding: 10px 12px; color: #fff; font-size: 0.85rem; outline: none; }
    .r-n { font-size: 0.85rem; font-weight: 800; margin: 0; }
    .r-i { font-size: 0.7rem; color: #a1a1aa; margin: 4px 0 0; font-family: monospace; }
    .b { border: none; border-radius: 10px; padding: 10px 13px; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
    .b-red { background: #dc2626; color: #fff; }
    .b-d { background: #450a0a; color: #f87171; }
    .wide { width: 100%; margin-top: 10px; }
    .b:disabled { opacity: 0.45; }
    .ap-err { font-size: 0.8rem; color: #fca5a5; }
    .ap-ok { font-size: 0.8rem; color: #34d399; }
    .ap-muted { font-size: 0.78rem; color: #71717a; }
  `],
})
export class AdminAdminsComponent implements OnInit {
  admins: any[] = [];
  newId = '';
  loading = false;
  saving = false;
  error = '';
  okMsg = '';

  constructor(private readonly api: AdminApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.getAdmins().subscribe({
      next: (r: any) => {
        this.loading = false;
        this.admins = Array.isArray(r) ? r : (r && r.data) || [];
      },
      error: () => { this.loading = false; this.error = 'Adminlarni yuklab bolmadi.'; },
    });
  }

  add(): void {
    const id = this.newId.trim();
    if (!id) { return; }
    this.saving = true;
    this.error = '';
    this.okMsg = '';
    this.api.addAdmin(id).subscribe({
      next: () => { this.saving = false; this.okMsg = 'Admin qoshildi.'; this.newId = ''; this.load(); },
      error: () => { this.saving = false; this.error = 'Qoshilmadi.'; },
    });
  }

  remove(a: any): void {
    const id = a && (a.id || a.telegramId);
    if (!id) { return; }
    this.api.removeAdmin(String(id)).subscribe({
      next: () => { this.okMsg = 'Olib tashlandi.'; this.load(); },
      error: () => { this.error = 'Olib tashlanmadi.'; },
    });
  }
}
