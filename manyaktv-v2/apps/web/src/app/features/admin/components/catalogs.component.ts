import { Component, OnInit } from '@angular/core';
import { AdminApiService } from './admin-api.service';

/** v1 AdminPanel -> "Ekran Kataloglari" bolimi. */
@Component({
  selector: 'app-admin-catalogs',
  template: `
    <div class="ap">
      <div class="ap-head">
        <h2>Ekran Kataloglari</h2>
        <button class="b b-red" (click)="add()">+ Katalog</button>
      </div>
      <p class="ap-hint">Bosh sahifadagi bolimlar tartibi va korinishi.</p>

      <p class="ap-err" *ngIf="error">{{ error }}</p>
      <p class="ap-muted" *ngIf="loading">Yuklanmoqda...</p>

      <div class="row" *ngFor="let c of catalogs; let i = index">
        <div class="row-t">
          <input class="in" [(ngModel)]="c.title" [ngModelOptions]="{ standalone: true }" placeholder="Katalog nomi" />
          <input class="in in-s" [(ngModel)]="c.id" [ngModelOptions]="{ standalone: true }" placeholder="cat_kino" />
        </div>
        <div class="row-b">
          <label class="ck">
            <input type="checkbox" [(ngModel)]="c.isVisible" [ngModelOptions]="{ standalone: true }" />
            <span>Korinadi</span>
          </label>
          <div class="ord">
            <button class="b b-g" (click)="move(i, -1)">&#9650;</button>
            <button class="b b-g" (click)="move(i, 1)">&#9660;</button>
            <button class="b b-d" (click)="remove(i)">&#10005;</button>
          </div>
        </div>
      </div>

      <button class="b b-red wide" [disabled]="saving" (click)="save()">
        {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
      </button>
      <p class="ap-ok" *ngIf="okMsg">{{ okMsg }}</p>
    </div>
  `,
  styles: [`
    .ap { padding: 16px; color: #fff; }
    .ap-head { display: flex; align-items: center; justify-content: space-between; }
    .ap-head h2 { font-size: 1rem; font-weight: 800; margin: 0; }
    .ap-hint { font-size: 0.72rem; color: #a1a1aa; margin: 6px 0 14px; }
    .ap-err { font-size: 0.78rem; color: #fca5a5; }
    .ap-ok { font-size: 0.78rem; color: #34d399; }
    .ap-muted { font-size: 0.78rem; color: #71717a; }
    .row { background: #18181b; border: 1px solid #27272a; border-radius: 14px; padding: 12px; margin-bottom: 10px; }
    .row-t { display: flex; gap: 8px; }
    .row-b { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
    .in { flex: 1; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 10px; padding: 9px 11px; color: #fff; font-size: 0.82rem; outline: none; }
    .in-s { max-width: 130px; font-family: monospace; }
    .ck { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #d4d4d8; }
    .ord { display: flex; gap: 6px; }
    .b { border: none; border-radius: 10px; padding: 8px 12px; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
    .b-red { background: #dc2626; color: #fff; }
    .b-g { background: #27272a; color: #e4e4e7; }
    .b-d { background: #450a0a; color: #f87171; }
    .wide { width: 100%; margin-top: 8px; padding: 13px; }
    .b:disabled { opacity: 0.5; }
  `],
})
export class AdminCatalogsComponent implements OnInit {
  catalogs: any[] = [];
  loading = false;
  saving = false;
  error = '';
  okMsg = '';

  constructor(private readonly api: AdminApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.getCatalogs().subscribe({
      next: (r: any) => {
        this.loading = false;
        const list = Array.isArray(r) ? r : (r && r.catalogs) || [];
        this.catalogs = list;
      },
      error: () => {
        this.loading = false;
        this.error = 'Kataloglarni yuklab bolmadi (server endpoint mavjud emas).';
      },
    });
  }

  add(): void {
    this.catalogs.push({ id: 'cat_new', title: 'Yangi katalog', isVisible: true, order: this.catalogs.length });
  }

  remove(i: number): void {
    this.catalogs.splice(i, 1);
  }

  move(i: number, dir: number): void {
    const j = i + dir;
    if (j < 0 || j >= this.catalogs.length) { return; }
    const tmp = this.catalogs[i];
    this.catalogs[i] = this.catalogs[j];
    this.catalogs[j] = tmp;
  }

  save(): void {
    this.saving = true;
    this.okMsg = '';
    this.error = '';
    this.catalogs.forEach((c: any, idx: number) => { c.order = idx; });
    this.api.saveCatalogs(this.catalogs).subscribe({
      next: () => { this.saving = false; this.okMsg = 'Saqlandi.'; },
      error: () => { this.saving = false; this.error = 'Saqlanmadi.'; },
    });
  }
}
