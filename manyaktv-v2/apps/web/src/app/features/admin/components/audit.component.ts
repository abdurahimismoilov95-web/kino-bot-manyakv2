import { Component, OnInit } from '@angular/core';
import { AdminApiService } from './admin-api.service';

/** v1 AdminPanel -> "Audit Jurnali" bolimi. */
@Component({
  selector: 'app-admin-audit',
  template: `
    <div class="ap">
      <h2>Audit Jurnali</h2>
      <p class="hint">Admin amallarining tarixi.</p>

      <p class="ap-err" *ngIf="error">{{ error }}</p>
      <p class="ap-muted" *ngIf="loading">Yuklanmoqda...</p>

      <div class="log" *ngFor="let l of logs">
        <div class="l-top">
          <span class="l-act">{{ l.action || l.type }}</span>
          <span class="l-time">{{ when(l.createdAt || l.timestamp) }}</span>
        </div>
        <p class="l-by">{{ l.actorName || l.adminName || ('ID ' + (l.actorId || l.adminId || '?')) }}</p>
        <p class="l-desc" *ngIf="l.description || l.details">{{ l.description || l.details }}</p>
      </div>

      <p class="ap-muted" *ngIf="!loading && logs.length === 0">Yozuvlar yoq.</p>
    </div>
  `,
  styles: [`
    .ap { padding: 16px; color: #fff; }
    h2 { font-size: 1rem; font-weight: 800; margin: 0; }
    .hint { font-size: 0.72rem; color: #a1a1aa; margin: 6px 0 14px; }
    .log { background: #18181b; border: 1px solid #27272a; border-radius: 13px; padding: 12px; margin-bottom: 9px; }
    .l-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .l-act { font-size: 0.8rem; font-weight: 800; color: #fbbf24; }
    .l-time { font-size: 0.66rem; color: #71717a; font-family: monospace; }
    .l-by { font-size: 0.72rem; color: #d4d4d8; margin: 5px 0 0; }
    .l-desc { font-size: 0.7rem; color: #a1a1aa; margin: 4px 0 0; line-height: 1.45; }
    .ap-err { font-size: 0.8rem; color: #fca5a5; }
    .ap-muted { font-size: 0.78rem; color: #71717a; }
  `],
})
export class AdminAuditComponent implements OnInit {
  logs: any[] = [];
  loading = false;
  error = '';

  constructor(private readonly api: AdminApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.getAuditLogs().subscribe({
      next: (r: any) => {
        this.loading = false;
        this.logs = Array.isArray(r) ? r : (r && r.data) || [];
      },
      error: () => { this.loading = false; this.error = 'Jurnalni yuklab bolmadi.'; },
    });
  }

  when(v: any): string {
    if (!v) { return ''; }
    const d = new Date(v);
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
}
