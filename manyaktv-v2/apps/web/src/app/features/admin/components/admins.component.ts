import { Component, OnInit } from '@angular/core';
import { AdminApiService } from './admin-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';

/** Adminlar bolimi - faqat bosh admin. Admin qoshish, nazorat, bloklash. */
@Component({
  selector: 'app-admin-admins',
  template: `
    <div class="ap">
      <div class="lock" *ngIf="!isSuper">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
        <p class="r-n">Bu bolim faqat bosh admin uchun</p>
      </div>

      <ng-container *ngIf="isSuper">
        <h2>Adminlar</h2>
        <p class="hint">Bu bolimni faqat siz korasiz. Admin qoshing, ularning harakatlarini kuzating, bloklang yoki olib tashlang.</p>

        <div class="sum">
          <div class="s"><b>{{ admins.length }}</b><span>Jami</span></div>
          <div class="s"><b class="g">{{ activeCount }}</b><span>Faol</span></div>
          <div class="s"><b class="r">{{ blockedCount }}</b><span>Bloklangan</span></div>
        </div>

        <div class="form">
          <input class="in" [(ngModel)]="newId" [ngModelOptions]="{ standalone: true }" inputmode="numeric" placeholder="Telegram ID (masalan 123456789)" />
          <button class="b b-red wide" [disabled]="saving" (click)="add()">
            {{ saving ? 'Qoshilmoqda...' : 'Admin qoshish' }}
          </button>
        </div>

        <p class="ap-err" *ngIf="error">{{ error }}</p>
        <p class="ap-ok" *ngIf="okMsg">{{ okMsg }}</p>
        <p class="ap-muted" *ngIf="loading">Yuklanmoqda...</p>

        <div class="card" *ngFor="let a of admins" [class.card-b]="a.isBanned">
          <div class="top">
            <div class="av">{{ initial(a) }}</div>
            <div class="info">
              <p class="r-n">{{ displayName(a) }}
                <span class="tag" [class.tag-s]="a.role === 'super_admin'">{{ a.role === 'super_admin' ? 'BOSH ADMIN' : 'ADMIN' }}</span>
              </p>
              <p class="r-i">ID: {{ a.telegramId || a.id }}<span *ngIf="a.username"> &middot; @{{ a.username }}</span></p>
            </div>
            <span class="st" [class.st-b]="a.isBanned">{{ a.isBanned ? 'Bloklangan' : 'Faol' }}</span>
          </div>

          <div class="meta">
            <span>Harakatlar: <b>{{ a.actionsCount || 0 }}</b></span>
            <span>Oxirgi kirish: <b>{{ a.lastSeenAt ? (a.lastSeenAt | date:'dd.MM.yy HH:mm') : '-' }}</b></span>
          </div>
          <p class="last" *ngIf="a.lastAction">Oxirgi amal: {{ actionLabel(a.lastAction.action) }}<span *ngIf="a.lastAction.description"> - {{ a.lastAction.description }}</span> ({{ a.lastAction.createdAt | date:'dd.MM HH:mm' }})</p>
          <p class="last warn" *ngIf="a.isBanned && a.banReason">Sabab: {{ a.banReason }}</p>

          <div class="acts" *ngIf="a.role !== 'super_admin'">
            <button class="b b-g" (click)="toggleLogs(a)">{{ openId === a.id ? 'Yopish' : 'Harakatlari' }}</button>
            <button class="b b-y" *ngIf="!a.isBanned" (click)="block(a)">Bloklash</button>
            <button class="b b-ok" *ngIf="a.isBanned" (click)="unblock(a)">Blokdan chiqarish</button>
            <button class="b b-d" (click)="remove(a)">Olib tashlash</button>
          </div>

          <div class="logs" *ngIf="openId === a.id">
            <p class="ap-muted" *ngIf="logsLoading">Yuklanmoqda...</p>
            <p class="ap-muted" *ngIf="!logsLoading && logs.length === 0">Hali hech qanday amal bajarmagan.</p>
            <div class="lg" *ngFor="let l of logs">
              <span class="lg-a">{{ actionLabel(l.action) }}</span>
              <span class="lg-d" *ngIf="l.description">{{ l.description }}</span>
              <span class="lg-t">{{ l.createdAt | date:'dd.MM.yyyy HH:mm' }}</span>
            </div>
          </div>
        </div>

        <p class="ap-muted" *ngIf="!loading && admins.length === 0">Adminlar royxati bosh.</p>
      </ng-container>
    </div>
  `,
  styles: [`
    .ap { padding: 16px; color: #fff; }
    h2 { font-size: 1rem; font-weight: 800; margin: 0; }
    .hint { font-size: 0.72rem; color: #a1a1aa; margin: 6px 0 14px; line-height: 1.45; }
    .lock { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 50px 10px; text-align: center; }
    .sum { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
    .s { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 10px; text-align: center; }
    .s b { display: block; font-size: 1.1rem; font-weight: 900; }
    .s b.g { color: #34d399; }
    .s b.r { color: #f87171; }
    .s span { font-size: 0.65rem; color: #a1a1aa; }
    .form, .card { background: #18181b; border: 1px solid #27272a; border-radius: 13px; padding: 13px; margin-bottom: 10px; }
    .card-b { border-color: #7f1d1d; background: #1c1111; }
    .top { display: flex; align-items: center; gap: 10px; }
    .av { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #dc2626, #7f1d1d); display: flex; align-items: center; justify-content: center; font-weight: 900; flex: 0 0 auto; }
    .info { flex: 1; min-width: 0; }
    .in { width: 100%; box-sizing: border-box; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 10px; padding: 10px 12px; color: #fff; font-size: 0.85rem; outline: none; }
    .r-n { font-size: 0.85rem; font-weight: 800; margin: 0; }
    .r-i { font-size: 0.7rem; color: #a1a1aa; margin: 4px 0 0; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tag { font-size: 0.55rem; font-weight: 900; padding: 2px 6px; border-radius: 999px; background: #27272a; color: #d4d4d8; margin-left: 4px; vertical-align: middle; }
    .tag-s { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .st { font-size: 0.62rem; font-weight: 800; padding: 3px 8px; border-radius: 999px; background: rgba(52,211,153,0.12); color: #34d399; flex: 0 0 auto; }
    .st-b { background: rgba(248,113,113,0.12); color: #f87171; }
    .meta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; font-size: 0.7rem; color: #a1a1aa; }
    .meta b { color: #fff; }
    .last { font-size: 0.7rem; color: #d4d4d8; margin: 8px 0 0; line-height: 1.4; word-break: break-word; }
    .warn { color: #fca5a5; }
    .acts { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 12px; }
    .b { border: none; border-radius: 10px; padding: 9px 8px; font-size: 0.72rem; font-weight: 800; cursor: pointer; }
    .b-red { background: #dc2626; color: #fff; }
    .b-g { background: #27272a; color: #d4d4d8; }
    .b-y { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .b-ok { background: rgba(52,211,153,0.15); color: #34d399; }
    .b-d { background: #450a0a; color: #f87171; }
    .wide { width: 100%; margin-top: 10px; padding: 11px; }
    .b:disabled { opacity: 0.45; }
    .logs { margin-top: 10px; border-top: 1px solid #27272a; padding-top: 8px; max-height: 320px; overflow-y: auto; }
    .lg { display: flex; flex-direction: column; gap: 2px; padding: 7px 0; border-bottom: 1px solid #202023; }
    .lg-a { font-size: 0.74rem; font-weight: 800; color: #fff; }
    .lg-d { font-size: 0.7rem; color: #a1a1aa; word-break: break-word; }
    .lg-t { font-size: 0.62rem; color: #71717a; font-family: monospace; }
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
  openId: string | null = null;
  logs: any[] = [];
  logsLoading = false;

  private readonly labels: Record<string, string> = {
    'catalogs.save': 'Kataloglarni saqladi',
    'plan.create': 'Tarif yaratdi',
    'plan.update': 'Tarifni tahrirladi',
    'plan.delete': 'Tarifni ochirdi',
    'promo.create': 'Promokod yaratdi',
    'promo.delete': 'Promokodni ochirdi',
    'settings.save': 'Sozlamalarni saqladi',
    'admin.add': 'Admin qoshdi',
    'admin.remove': 'Adminni olib tashladi',
    'admin.block': 'Adminni blokladi',
    'admin.unblock': 'Adminni blokdan chiqardi',
  };

  constructor(
    private readonly api: AdminApiService,
    private readonly auth: AuthService,
    private readonly dlg: DialogService,
  ) {}

  get isSuper(): boolean {
    const u: any = this.auth.currentUser;
    return !!u && u.role === 'super_admin';
  }

  get activeCount(): number { return this.admins.filter((a) => !a.isBanned).length; }
  get blockedCount(): number { return this.admins.filter((a) => !!a.isBanned).length; }

  ngOnInit(): void {
    if (this.isSuper) { this.load(); }
  }

  displayName(a: any): string {
    const n = [a && a.firstName, a && a.lastName].filter((x) => !!x).join(' ');
    return n || 'Admin';
  }

  initial(a: any): string {
    return (this.displayName(a).charAt(0) || 'A').toUpperCase();
  }

  actionLabel(k: string): string {
    return this.labels[k] || k;
  }

  private errMsg(e: any, fb: string): string {
    const m = e && e.error && e.error.message;
    return typeof m === 'string' && m ? m : fb;
  }

  load(): void {
    this.loading = true;
    this.api.getAdmins().subscribe({
      next: (r: any) => {
        this.loading = false;
        this.admins = Array.isArray(r) ? r : (r && r.data) || [];
      },
      error: (e: any) => { this.loading = false; this.error = this.errMsg(e, 'Adminlarni yuklab bolmadi.'); },
    });
  }

  async add(): Promise<void> {
    const id = this.newId.trim();
    this.error = '';
    this.okMsg = '';
    if (!/^[0-9]{3,20}$/.test(id)) { this.error = 'Telegram ID faqat raqamlardan iborat bolishi kerak.'; return; }
    const ok = await this.dlg.confirm(id + ' ID li foydalanuvchini admin qilasizmi?', { title: 'Admin qoshish', okText: 'Qoshish' });
    if (!ok) { return; }
    this.saving = true;
    this.api.addAdmin(id).subscribe({
      next: () => { this.saving = false; this.okMsg = 'Admin qoshildi.'; this.newId = ''; this.load(); },
      error: (e: any) => { this.saving = false; this.error = this.errMsg(e, 'Qoshilmadi.'); },
    });
  }

  toggleLogs(a: any): void {
    if (this.openId === a.id) { this.openId = null; this.logs = []; return; }
    this.openId = a.id;
    this.logs = [];
    this.logsLoading = true;
    this.api.getAdminLogs(String(a.id)).subscribe({
      next: (r: any) => { this.logsLoading = false; this.logs = Array.isArray(r) ? r : (r && r.data) || []; },
      error: () => { this.logsLoading = false; this.logs = []; },
    });
  }

  async block(a: any): Promise<void> {
    const reason = await this.dlg.prompt(this.displayName(a) + ' ni bloklash sababi (ixtiyoriy):', '', {
      title: 'Adminni bloklash', okText: 'Bloklash', danger: true, placeholder: 'Masalan: qoidabuzarlik',
    });
    if (reason === null) { return; }
    this.error = '';
    this.api.blockAdmin(String(a.id), reason).subscribe({
      next: () => { this.okMsg = 'Admin bloklandi. U endi ilovaga kira olmaydi.'; this.load(); },
      error: (e: any) => { this.error = this.errMsg(e, 'Bloklanmadi.'); },
    });
  }

  async unblock(a: any): Promise<void> {
    const ok = await this.dlg.confirm(this.displayName(a) + ' ni blokdan chiqarasizmi?', { title: 'Blokdan chiqarish', okText: 'Chiqarish' });
    if (!ok) { return; }
    this.error = '';
    this.api.unblockAdmin(String(a.id)).subscribe({
      next: () => { this.okMsg = 'Admin blokdan chiqarildi.'; this.load(); },
      error: (e: any) => { this.error = this.errMsg(e, 'Bajarilmadi.'); },
    });
  }

  async remove(a: any): Promise<void> {
    const id = a && (a.id || a.telegramId);
    if (!id) { return; }
    const ok = await this.dlg.confirm(this.displayName(a) + ' adminlikdan olib tashlansinmi? U oddiy foydalanuvchiga aylanadi.', {
      title: 'Adminni olib tashlash', okText: 'Olib tashlash', danger: true,
    });
    if (!ok) { return; }
    this.error = '';
    this.api.removeAdmin(String(id)).subscribe({
      next: () => { this.okMsg = 'Olib tashlandi.'; if (this.openId === a.id) { this.openId = null; } this.load(); },
      error: (e: any) => { this.error = this.errMsg(e, 'Olib tashlanmadi.'); },
    });
  }
}
