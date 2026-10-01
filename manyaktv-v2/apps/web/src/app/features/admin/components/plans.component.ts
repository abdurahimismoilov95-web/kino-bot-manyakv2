import { Component, OnInit } from '@angular/core';
import { AdminApiService } from './admin-api.service';
import { DialogService } from '../../../core/services/dialog.service';

/** v1 AdminPanel -> "Tariflar" bolimi. */
@Component({
  selector: 'app-admin-plans',
  template: `
    <div class="ap">
      <div class="ap-head">
        <h2>Tariflar</h2>
        <button class="b b-red" (click)="newPlan()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          <span>Tarif</span>
        </button>
      </div>

      <p class="ap-err" *ngIf="error">{{ error }}</p>
      <p class="ap-muted" *ngIf="loading">Yuklanmoqda...</p>

      <div class="card" *ngFor="let p of plans">
        <div class="c-top">
          <div>
            <p class="c-t">{{ p.name || p.title }}</p>
            <p class="c-s">{{ p.durationDays || p.days }} kun &middot; {{ money(p.price) }} UZS</p>
          </div>
          <div class="acts">
            <button class="b b-g ic" title="Tahrirlash" (click)="edit(p)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
            </button>
            <button class="b b-d ic" title="O'chirish" (click)="del(p)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
          </div>
        </div>
      </div>

      <p class="ap-muted" *ngIf="!loading && plans.length === 0">Tariflar yoq.</p>

      <div class="form" *ngIf="draft">
        <p class="c-t">{{ draft.id ? 'Tarifni tahrirlash' : 'Yangi tarif' }}</p>
        <input class="in" [(ngModel)]="draft.name" [ngModelOptions]="{ standalone: true }" placeholder="Nomi (1 oylik VIP)" />
        <input class="in" type="number" [(ngModel)]="draft.price" [ngModelOptions]="{ standalone: true }" placeholder="Narxi (UZS)" />
        <input class="in" type="number" [(ngModel)]="draft.durationDays" [ngModelOptions]="{ standalone: true }" placeholder="Muddat (kun)" />
        <input class="in" [(ngModel)]="draft.description" [ngModelOptions]="{ standalone: true }" placeholder="Izoh" />
        <div class="acts">
          <button class="b b-red" [disabled]="saving" (click)="save()">{{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}</button>
          <button class="b b-g" (click)="draft = null">Bekor</button>
        </div>
      </div>

      <p class="ap-ok" *ngIf="okMsg">{{ okMsg }}</p>
    </div>
  `,
  styles: [`
    .ap { padding: 16px; color: #fff; }
    .ap-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .ap-head h2 { font-size: 1rem; font-weight: 800; margin: 0; }
    .ap-err { font-size: 0.78rem; color: #fca5a5; }
    .ap-ok { font-size: 0.78rem; color: #34d399; }
    .ap-muted { font-size: 0.78rem; color: #71717a; }
    .card, .form { background: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 13px; margin-bottom: 10px; }
    .c-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .c-t { font-size: 0.88rem; font-weight: 800; margin: 0; }
    .c-s { font-size: 0.72rem; color: #a1a1aa; margin: 4px 0 0; }
    .acts { display: flex; gap: 6px; margin-top: 8px; }
    .c-top .acts { margin-top: 0; }
    .in { display: block; width: 100%; box-sizing: border-box; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 10px; padding: 10px 12px; color: #fff; font-size: 0.82rem; outline: none; margin-top: 8px; }
    .b { display: inline-flex; align-items: center; justify-content: center; gap: 5px; border: none; border-radius: 10px; padding: 9px 13px; font-size: 0.75rem; font-weight: 700; cursor: pointer; line-height: 1; }
    .b.ic { width: 34px; height: 34px; padding: 0; }
    .b-red { background: #dc2626; color: #fff; }
    .b-g { background: #27272a; color: #e4e4e7; }
    .b-d { background: #450a0a; color: #f87171; }
    .b:disabled { opacity: 0.5; }
  `],
})
export class AdminPlansComponent implements OnInit {
  plans: any[] = [];
  draft: any = null;
  loading = false;
  saving = false;
  error = '';
  okMsg = '';

  constructor(private readonly api: AdminApiService, private readonly dlg: DialogService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.getPlans().subscribe({
      next: (r: any) => {
        this.loading = false;
        this.plans = Array.isArray(r) ? r : (r && r.data) || [];
      },
      error: () => { this.loading = false; this.error = 'Tariflarni yuklab bolmadi.'; },
    });
  }

  money(v: any): string {
    try { return Number(v || 0).toLocaleString('ru-RU'); } catch { return String(v || 0); }
  }

  newPlan(): void {
    this.error = '';
    this.okMsg = '';
    this.draft = { name: '', price: 0, durationDays: 30, description: '' };
  }

  edit(p: any): void {
    this.error = '';
    this.okMsg = '';
    this.draft = Object.assign({}, p);
  }

  save(): void {
    if (!this.draft) { return; }
    const name = String(this.draft.name || '').trim();
    if (!name) { this.error = 'Tarif nomini kiriting.'; return; }
    if (!(Number(this.draft.price) > 0)) { this.error = 'Narxni togri kiriting.'; return; }
    if (!(Number(this.draft.durationDays) > 0)) { this.error = 'Muddatni (kun) togri kiriting.'; return; }
    this.saving = true;
    this.okMsg = '';
    this.error = '';
    this.api.savePlan(this.draft).subscribe({
      next: () => { this.saving = false; this.draft = null; this.okMsg = 'Saqlandi.'; this.load(); },
      error: () => { this.saving = false; this.error = 'Saqlanmadi.'; },
    });
  }

  del(p: any): void {
    if (!p || !p.id) { return; }
    const name = p.name || p.title || 'Tarif';
    this.dlg.confirm('"' + name + '" tarifi ochirilsinmi?', { title: 'Tarifni ochirish', okText: 'Ochirish', danger: true }).then((ok) => {
      if (!ok) { return; }
      this.error = '';
      this.api.deletePlan(String(p.id)).subscribe({
        next: () => { this.okMsg = 'Ochirildi.'; this.load(); },
        error: () => { this.error = 'Ochirilmadi.'; },
      });
    });
  }
}
