import { Component, OnInit } from '@angular/core';
import { AdminApiService } from './admin-api.service';

/** v1 AdminPanel -> "Tariflar" bolimi. */
@Component({
  selector: 'app-admin-plans',
  template: `
    <div class="ap">
      <div class="ap-head">
        <h2>Tariflar</h2>
        <button class="b b-red" (click)="newPlan()">+ Tarif</button>
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
            <button class="b b-g" (click)="edit(p)">Tahrir</button>
            <button class="b b-d" (click)="del(p)">&#10005;</button>
          </div>
        </div>
      </div>

      <div class="form" *ngIf="draft">
        <p class="c-t">{{ draft.id ? 'Tarifni tahrirlash' : 'Yangi tarif' }}</p>
        <input class="in" [(ngModel)]="draft.name" [ngModelOptions]="{ standalone: true }" placeholder="Nomi (1 oylik VIP)" />
        <input class="in" type="number" [(ngModel)]="draft.price" [ngModelOptions]="{ standalone: true }" placeholder="Narxi (UZS)" />
        <input class="in" type="number" [(ngModel)]="draft.durationDays" [ngModelOptions]="{ standalone: true }" placeholder="Muddat (kun)" />
        <input class="in" [(ngModel)]="draft.description" [ngModelOptions]="{ standalone: true }" placeholder="Izoh" />
        <div class="acts">
          <button class="b b-red" [disabled]="saving" (click)="save()">Saqlash</button>
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
    .in { width: 100%; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 10px; padding: 10px 12px; color: #fff; font-size: 0.82rem; outline: none; margin-top: 8px; }
    .b { border: none; border-radius: 10px; padding: 9px 13px; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
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

  constructor(private readonly api: AdminApiService) {}

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
    this.draft = { name: '', price: 0, durationDays: 30, description: '' };
  }

  edit(p: any): void {
    this.draft = Object.assign({}, p);
  }

  save(): void {
    if (!this.draft) { return; }
    this.saving = true;
    this.okMsg = '';
    this.api.savePlan(this.draft).subscribe({
      next: () => { this.saving = false; this.draft = null; this.okMsg = 'Saqlandi.'; this.load(); },
      error: () => { this.saving = false; this.error = 'Saqlanmadi.'; },
    });
  }

  del(p: any): void {
    if (!p || !p.id) { return; }
    this.api.deletePlan(String(p.id)).subscribe({
      next: () => { this.okMsg = 'Ochirildi.'; this.load(); },
      error: () => { this.error = 'Ochirilmadi.'; },
    });
  }
}
