import { Component, OnInit } from '@angular/core';
import { AdminApiService } from './admin-api.service';

/** v1 AdminPanel -> "Promokodlar" bolimi. */
@Component({
  selector: 'app-admin-promos',
  template: `
    <div class="ap">
      <h2>Promokodlar</h2>

      <div class="form">
        <input class="in" [(ngModel)]="draft.code" [ngModelOptions]="{ standalone: true }" placeholder="KOD (MANYAK10)" />
        <input class="in" type="number" [(ngModel)]="draft.discountPercent" [ngModelOptions]="{ standalone: true }" placeholder="Chegirma %" />
        <input class="in" type="number" [(ngModel)]="draft.maxUses" [ngModelOptions]="{ standalone: true }" placeholder="Maksimal foydalanish" />
        <button class="b b-red wide" [disabled]="saving" (click)="create()">
          {{ saving ? 'Yaratilmoqda...' : 'Promokod yaratish' }}
        </button>
      </div>

      <p class="ap-err" *ngIf="error">{{ error }}</p>
      <p class="ap-ok" *ngIf="okMsg">{{ okMsg }}</p>
      <p class="ap-muted" *ngIf="loading">Yuklanmoqda...</p>

      <div class="card" *ngFor="let p of promos">
        <div class="c-top">
          <div>
            <p class="c-code">{{ p.code }}</p>
            <p class="c-s">
              {{ p.discountPercent || p.discount }}% &middot;
              {{ p.usedCount || 0 }}/{{ p.maxUses || '&#8734;' }} ishlatilgan
            </p>
          </div>
          <button class="b b-d" (click)="del(p)">&#10005;</button>
        </div>
      </div>

      <p class="ap-muted" *ngIf="!loading && promos.length === 0">Promokodlar yoq.</p>
    </div>
  `,
  styles: [`
    .ap { padding: 16px; color: #fff; }
    h2 { font-size: 1rem; font-weight: 800; margin: 0 0 12px; }
    .form, .card { background: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 13px; margin-bottom: 10px; }
    .in { width: 100%; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 10px; padding: 10px 12px; color: #fff; font-size: 0.82rem; outline: none; margin-bottom: 8px; }
    .c-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .c-code { font-size: 0.9rem; font-weight: 900; margin: 0; font-family: monospace; color: #fbbf24; letter-spacing: 0.06em; }
    .c-s { font-size: 0.72rem; color: #a1a1aa; margin: 4px 0 0; }
    .b { border: none; border-radius: 10px; padding: 9px 13px; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
    .b-red { background: #dc2626; color: #fff; }
    .b-d { background: #450a0a; color: #f87171; }
    .wide { width: 100%; padding: 12px; }
    .b:disabled { opacity: 0.5; }
    .ap-err { font-size: 0.78rem; color: #fca5a5; }
    .ap-ok { font-size: 0.78rem; color: #34d399; }
    .ap-muted { font-size: 0.78rem; color: #71717a; }
  `],
})
export class AdminPromosComponent implements OnInit {
  promos: any[] = [];
  draft: any = { code: '', discountPercent: 10, maxUses: 100 };
  loading = false;
  saving = false;
  error = '';
  okMsg = '';

  constructor(private readonly api: AdminApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.getPromos().subscribe({
      next: (r: any) => {
        this.loading = false;
        this.promos = Array.isArray(r) ? r : (r && r.data) || [];
      },
      error: () => { this.loading = false; this.error = 'Promokodlarni yuklab bolmadi.'; },
    });
  }

  create(): void {
    const code = String(this.draft.code || '').trim().toUpperCase();
    if (!code) { this.error = 'Kod kiritilmadi.'; return; }
    this.saving = true;
    this.error = '';
    this.okMsg = '';
    this.api.createPromo({
      code: code,
      discountPercent: Number(this.draft.discountPercent) || 0,
      maxUses: Number(this.draft.maxUses) || 0,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.okMsg = 'Promokod yaratildi.';
        this.draft = { code: '', discountPercent: 10, maxUses: 100 };
        this.load();
      },
      error: () => { this.saving = false; this.error = 'Yaratilmadi.'; },
    });
  }

  del(p: any): void {
    if (!p || !p.id) { return; }
    this.api.deletePromo(String(p.id)).subscribe({
      next: () => { this.okMsg = 'Ochirildi.'; this.load(); },
      error: () => { this.error = 'Ochirilmadi.'; },
    });
  }
}
