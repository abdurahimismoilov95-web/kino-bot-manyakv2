import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-stats',
  template: `
    <div class="st">
      <div class="st-load" *ngIf="loading">Yuklanmoqda...</div>
      <div class="st-err" *ngIf="error">Statistikani yuklab bolmadi. <button (click)="load()">Qayta urinish</button></div>

      <ng-container *ngIf="d">
        <div class="kpi">
          <div class="card"><div class="lbl">Jami daromad</div><div class="val g">{{ d.revenue.all | number }} <small>som</small></div><div class="sub">Barcha vaqt</div></div>
          <div class="card"><div class="lbl">{{ d.year }}-yil daromadi</div><div class="val g">{{ d.revenue.year | number }} <small>som</small></div><div class="sub">Butun yil davomida</div></div>
          <div class="card"><div class="lbl">VIP (1 oy)</div><div class="val a">{{ d.vip.soldMonth }} <small>ta</small></div><div class="sub">{{ d.revenue.vipMonth | number }} som</div></div>
          <div class="card"><div class="lbl">Kino sotuvi (1 oy)</div><div class="val">{{ d.singleSoldMonth }} <small>ta</small></div><div class="sub">{{ d.revenue.singleMonth | number }} som</div></div>
          <div class="card"><div class="lbl">Jami tomoshalar</div><div class="val">{{ d.totals.views | number }}</div><div class="sub">Barcha kontent</div></div>
          <div class="card"><div class="lbl">Kutilayotgan cheklar</div><div class="val a">{{ d.pendingReceipts }}</div><div class="sub">Tasdiqlanishi kerak</div></div>
          <div class="card"><div class="lbl">Jami kontent</div><div class="val">{{ d.totals.contents }}</div><div class="sub">Kino, serial, drama, anime</div></div>
          <div class="card"><div class="lbl">Sotilgan kinolar</div><div class="val">{{ d.totals.singleSold }}</div><div class="sub">Yakka xaridlar</div></div>
        </div>

        <div class="panel">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>
            <span>{{ d.year }}-yil oylar boyicha daromad</span>
          </h3>
          <div class="split">
            <span>VIP: <b class="a">{{ d.revenue.vipYear | number }}</b> som ({{ d.vip.soldYear }} ta)</span>
            <span>Kino: <b class="g">{{ d.revenue.singleYear | number }}</b> som</span>
          </div>
          <div class="bars">
            <div class="bar-col" *ngFor="let m of d.months">
              <div class="bar-val">{{ m.total ? shortNum(m.total) : '' }}</div>
              <div class="bar-track"><div class="bar-fill" [style.height.%]="barH(m.total)"></div></div>
              <div class="bar-lbl">{{ monthNames[m.month - 1] }}</div>
            </div>
          </div>
        </div>

        <div class="panel">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>
            <span>Har bir kino/drama daromadi</span>
          </h3>
          <div class="tbl-wrap">
            <table>
              <thead>
                <tr><th>Nomi</th><th>Turi</th><th>Narxi</th><th>Sotilgan</th><th>Tomosha</th><th>Daromad</th><th>Holat</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of d.contents">
                  <td class="nm">{{ c.title }}<div class="yr" *ngIf="c.year">{{ c.year }}</div></td>
                  <td><span class="tag">{{ typeLabel(c.type) }}</span></td>
                  <td>{{ c.price > 0 ? (c.price | number) + ' som' : 'Bepul' }}</td>
                  <td>{{ c.sold }}</td>
                  <td>{{ c.viewsCount | number }}</td>
                  <td class="g"><b>{{ c.revenue | number }} som</b></td>
                  <td>
                    <span class="tag a" *ngIf="c.isPremium">PREMIUM</span>
                    <span class="tag g2" *ngIf="!c.isPremium">BEPUL</span>
                    <span class="tag b" *ngIf="c.isSinglePurchase">SOTUV</span>
                  </td>
                </tr>
                <tr *ngIf="!d.contents.length"><td colspan="7" class="empty">Kontent yoq</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="panel">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>
            <span>Server holati</span>
          </h3>
          <div class="srv">
            <div class="srv-i"><span>Holat</span><b [class.g]="d.server.ok" [class.r]="!d.server.ok">{{ d.server.ok ? 'Ishlayapti' : 'Baza xatosi' }}</b></div>
            <div class="srv-i"><span>Baza javobi</span><b>{{ d.server.dbMs }} ms</b></div>
            <div class="srv-i"><span>Ishlash vaqti</span><b>{{ uptime(d.server.uptimeSec) }}</b></div>
            <div class="srv-i"><span>Xotira</span><b>{{ d.server.memoryMb }} MB</b></div>
            <div class="srv-i"><span>Heap</span><b>{{ d.server.heapMb }} MB</b></div>
            <div class="srv-i"><span>Node</span><b>{{ d.server.nodeVersion }}</b></div>
            <div class="srv-i"><span>Muhit</span><b>{{ d.server.env }}</b></div>
          </div>
          <button class="ref" (click)="load()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
            <span>Yangilash</span>
          </button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .st { margin-bottom: 20px; }
    .st-load, .st-err { text-align: center; padding: 20px; color: #a1a1aa; font-size: 13px; }
    .st-err button { background: #dc2626; color: #fff; border: none; border-radius: 8px; padding: 6px 12px; margin-left: 6px; }
    .kpi { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
    @media (min-width: 720px) { .kpi { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 14px; }
    .lbl { font-size: 11px; color: #a1a1aa; }
    .val { font-size: 20px; font-weight: 900; color: #fff; margin-top: 4px; word-break: break-word; }
    .val small { font-size: 11px; font-weight: 600; color: #a1a1aa; }
    .sub { font-size: 10px; color: #71717a; margin-top: 3px; }
    .g { color: #34d399; }
    .a { color: #fbbf24; }
    .r { color: #f87171; }
    .panel { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 14px; margin-bottom: 14px; }
    .panel h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; font-size: 14px; font-weight: 800; color: #fff; }
    .panel h3 svg { flex: 0 0 auto; }
    .split { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: #a1a1aa; margin-bottom: 12px; }
    .split b { font-weight: 800; }
    .bars { display: flex; align-items: flex-end; gap: 4px; height: 170px; }
    .bar-col { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; height: 100%; }
    .bar-val { font-size: 8px; color: #a1a1aa; height: 12px; white-space: nowrap; }
    .bar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; background: rgba(39,39,42,0.5); border-radius: 6px; overflow: hidden; }
    .bar-fill { width: 100%; background: linear-gradient(to top, #b91c1c, #ef4444); min-height: 0; border-radius: 6px 6px 0 0; }
    .bar-lbl { font-size: 9px; color: #71717a; margin-top: 4px; }
    .tbl-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 8px; color: #a1a1aa; font-weight: 700; border-bottom: 1px solid #27272a; white-space: nowrap; background: rgba(9,9,11,0.6); }
    td { padding: 8px; color: #d4d4d8; border-bottom: 1px solid rgba(39,39,42,0.6); white-space: nowrap; }
    .nm { font-weight: 800; color: #fff; max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
    .yr { font-size: 10px; color: #71717a; font-weight: 500; }
    .tag { display: inline-block; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 6px; background: #27272a; color: #d4d4d8; margin-right: 3px; }
    .tag.a { background: rgba(120,53,15,0.5); color: #fbbf24; }
    .tag.g2 { background: rgba(6,78,59,0.5); color: #34d399; }
    .tag.b { background: rgba(30,58,138,0.5); color: #60a5fa; }
    .empty { text-align: center; color: #71717a; padding: 18px; }
    .srv { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    @media (min-width: 720px) { .srv { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    .srv-i { background: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 3px; }
    .srv-i span { font-size: 10px; color: #71717a; }
    .srv-i b { font-size: 13px; color: #fff; }
    .ref { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; background: #27272a; color: #e4e4e7; border: 1px solid #3f3f46; border-radius: 10px; padding: 8px 14px; font-size: 12px; font-weight: 700; cursor: pointer; }
  `],
})
export class AdminStatsComponent implements OnInit {
  d: any = null;
  loading = true;
  error = false;
  monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = false;
    this.http.get<any>(environment.apiUrl + '/admin/stats').subscribe({
      next: (r: any) => { this.d = r; this.loading = false; },
      error: () => { this.loading = false; this.error = true; },
    });
  }

  barH(v: number): number {
    if (!this.d) { return 0; }
    let max = 0;
    this.d.months.forEach((m: any) => { if (m.total > max) { max = m.total; } });
    return max > 0 ? Math.max(3, Math.round((v / max) * 100)) : 0;
  }

  shortNum(n: number): string {
    if (n >= 1000000) { return (n / 1000000).toFixed(1) + 'M'; }
    if (n >= 1000) { return Math.round(n / 1000) + 'k'; }
    return String(n);
  }

  typeLabel(t: string): string {
    if (t === 'short_drama') { return 'Mini drama'; }
    if (t === 'series') { return 'Serial'; }
    if (t === 'anime_series') { return 'Anime'; }
    return 'Kino';
  }

  uptime(sec: number): string {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) { return d + ' kun ' + h + ' soat'; }
    if (h > 0) { return h + ' soat ' + m + ' daq'; }
    return m + ' daq';
  }
}
