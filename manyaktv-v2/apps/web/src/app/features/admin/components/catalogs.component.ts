import { Component, OnInit } from '@angular/core';
import { AdminApiService } from './admin-api.service';
import { DialogService } from '../../../core/services/dialog.service';

/** v1 AdminPanel -> "Ekran Kataloglari" bolimi. */
@Component({
  selector: 'app-admin-catalogs',
  template: `
    <div class="ap">
      <div class="ap-head">
        <h2>Ekran Kataloglari</h2>
        <button class="b b-red" (click)="add()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          <span>Katalog</span>
        </button>
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
            <button class="b b-g ic" title="Yuqoriga" [disabled]="i === 0" (click)="move(i, -1)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
            <button class="b b-g ic" title="Pastga" [disabled]="i === catalogs.length - 1" (click)="move(i, 1)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <button class="b b-d ic" title="O'chirish" (click)="remove(i)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
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
    .in { flex: 1; min-width: 0; box-sizing: border-box; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 10px; padding: 9px 11px; color: #fff; font-size: 0.82rem; outline: none; }
    .in-s { max-width: 130px; font-family: monospace; }
    .ck { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #d4d4d8; }
    .ord { display: flex; gap: 6px; }
    .b { display: inline-flex; align-items: center; justify-content: center; gap: 5px; border: none; border-radius: 10px; padding: 8px 12px; font-size: 0.75rem; font-weight: 700; cursor: pointer; line-height: 1; }
    .b.ic { width: 34px; height: 34px; padding: 0; }
    .b-red { background: #dc2626; color: #fff; }
    .b-g { background: #27272a; color: #e4e4e7; }
    .b-d { background: #450a0a; color: #f87171; }
    .wide { width: 100%; margin-top: 8px; padding: 13px; }
    .b:disabled { opacity: 0.4; cursor: default; }
  `],
})
export class AdminCatalogsComponent implements OnInit {
  catalogs: any[] = [];
  loading = false;
  saving = false;
  error = '';
  okMsg = '';

  constructor(private readonly api: AdminApiService, private readonly dlg: DialogService) {}

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
        this.error = 'Kataloglarni yuklab bolmadi.';
      },
    });
  }

  add(): void {
    this.catalogs.push({ id: 'cat_' + Date.now().toString(36), title: 'Yangi katalog', isVisible: true, order: this.catalogs.length });
  }

  remove(i: number): void {
    const c = this.catalogs[i];
    const name = (c && c.title) || 'Katalog';
    this.dlg.confirm('"' + name + '" katalogi olib tashlansinmi? Saqlash tugmasini bosgandan keyin kuchga kiradi.', { title: 'Katalogni olib tashlash', okText: 'Olib tashlash', danger: true }).then((ok) => {
      if (!ok) { return; }
      this.catalogs.splice(i, 1);
    });
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
