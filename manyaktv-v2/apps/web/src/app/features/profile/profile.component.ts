import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-profile',
  template: `
    <div class="page">
      <!-- Ixcham sarlavha -->
      <div class="hero">
        <div class="avatar-wrap">
          <img class="avatar" [class.avatar-vip]="isVip" [src]="avatar" [alt]="displayName" (error)="onAvatarError($event)" />
          <span class="crown" *ngIf="isVip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M3 18h18l1-11-5 4-5-7-5 7-5-4z"/></svg>
          </span>
        </div>
        <div class="hero-info">
          <h2 class="name">{{ displayName }}<span class="adm-tag" *ngIf="isAdmin">ADMIN</span></h2>
          <p class="handle">{{ handle }}<span *ngIf="telegramId"> &middot; ID {{ telegramId }}</span></p>
          <span class="badge" [class.badge-vip]="isVip" [class.badge-free]="!isVip">{{ isVip ? 'VIP obunachi' : 'Bepul reja' }}</span>
        </div>
      </div>

      <!-- Tasdiqlash -->
      <div class="row-card ver" [class.ver-ok]="isVerified">
        <svg *ngIf="isVerified" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <svg *ngIf="!isVerified" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/></svg>
        <div class="grow">
          <p class="rc-t">{{ isVerified ? 'Hisob tasdiqlangan' : 'Hisob tasdiqlanmagan' }}</p>
          <p class="rc-s">{{ isVerified ? (phone || ('ID ' + telegramId)) : 'Kontaktni botga yuborib tasdiqlang' }}</p>
        </div>
        <button class="btn btn-blue sm" *ngIf="!isVerified" (click)="openVerify()">Tasdiqlash</button>
      </div>

      <!-- Admin -->
      <div class="row-card adm" *ngIf="isAdmin">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/></svg>
        <div class="grow">
          <p class="rc-t">Admin panel <span class="adm-badge">FAOL</span></p>
          <p class="rc-s">Kino, cheklar, foydalanuvchilar</p>
        </div>
        <button class="btn btn-red sm" (click)="goToAdmin()">Kirish</button>
      </div>

      <!-- VIP -->
      <div class="row-card vip" *ngIf="isVip">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b"><path d="M13 2L3 14h8l-1 8 10-12h-8z"/></svg>
        <div class="grow">
          <p class="rc-t">VIP obuna faol</p>
          <p class="rc-s" *ngIf="vipDaysLeft > 0">{{ vipDaysLeft }} kun qoldi &middot; {{ vipExpiresText }}</p>
          <p class="rc-s" *ngIf="vipDaysLeft === 0">Muddatsiz</p>
        </div>
        <button class="btn btn-ghost sm" (click)="goToSubscription()">Uzaytirish</button>
      </div>
      <div class="warn" *ngIf="isVip && isExpiringSoon">Obuna tugashiga kam qoldi.</div>

      <div class="row-card promo" *ngIf="!isVip">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b"><path d="M3 18h18l1-11-5 4-5-7-5 7-5-4z"/></svg>
        <div class="grow">
          <p class="rc-t">VIP obuna oling</p>
          <p class="rc-s">Barcha premium kinolar cheksiz</p>
        </div>
        <button class="btn btn-red sm" (click)="goToSubscription()">Olish</button>
      </div>

      <!-- Statistika: bitta qatorda -->
      <div class="stats">
        <div class="stat"><p class="stat-num amber">{{ tokens }}</p><p class="stat-label">Token</p></div>
        <div class="stat"><p class="stat-num orange">{{ streak }}</p><p class="stat-label">Ketma-ket</p></div>
        <div class="stat"><p class="stat-num green">{{ historyCount }}</p><p class="stat-label">Korilgan</p></div>
        <div class="stat"><p class="stat-num green">{{ bonusText }}</p><p class="stat-label">Bonus UZS</p></div>
      </div>

      <!-- Kunlik bonus -->
      <button class="btn btn-checkin" (click)="checkin()" [disabled]="checkinDone || checkinLoading">{{ checkinLabel }}</button>
      <p class="msg-ok" *ngIf="checkinMsg">{{ checkinMsg }}</p>

      <!-- Promokod -->
      <div class="promo-row">
        <input class="input" type="text" placeholder="Promokod" [(ngModel)]="promoInput" [ngModelOptions]="{ standalone: true }" />
        <button class="btn btn-red sm" (click)="applyPromo()">Faollash</button>
      </div>
      <p class="msg-ok" *ngIf="promoMsg">{{ promoMsg }}</p>

      <!-- Menyu -->
      <div class="menu">
        <div class="menu-item" (click)="goToSubscription()">
          <svg class="mi" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18l1-11-5 4-5-7-5 7-5-4z"/></svg>
          <span class="grow">Obuna rejalari</span><span class="chev">&rsaquo;</span>
        </div>
        <div class="menu-item" (click)="go('/history')">
          <svg class="mi" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
          <span class="grow">Korish tarixi</span><span class="chev">&rsaquo;</span>
        </div>
        <div class="menu-item" (click)="go('/favorites')">
          <svg class="mi" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span class="grow">Saqlangan</span><span class="chev">&rsaquo;</span>
        </div>
        <div class="menu-item" (click)="openBot()">
          <svg class="mi" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          <span class="grow">Telegram bot</span><span class="chev">&rsaquo;</span>
        </div>
        <div class="menu-item" (click)="openAdminContact()">
          <svg class="mi" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="grow">Adminga murojaat</span><span class="chev">&rsaquo;</span>
        </div>
        <div class="menu-item" (click)="clearCache()">
          <svg class="mi" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          <span class="grow">Keshni tozalash</span><span class="chev">&rsaquo;</span>
        </div>
        <div class="menu-item admin" *ngIf="isAdmin" (click)="goToAdmin()">
          <svg class="mi" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/></svg>
          <span class="grow">Admin panel</span><span class="chev">&rsaquo;</span>
        </div>
        <div class="menu-item danger" (click)="logout()">
          <svg class="mi" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span class="grow">Chiqish</span><span class="chev">&rsaquo;</span>
        </div>
      </div>

      <p class="version">MANYAK TV v2.0.0</p>
    </div>

    <app-telegram-verify
      [open]="verifyOpen"
      [dismissible]="true"
      (verified)="onVerified($event)"
      (closed)="verifyOpen = false"></app-telegram-verify>

    <div class="dialog-backdrop" *ngIf="dialog" (click)="dialog = null">
      <div class="dialog" (click)="$event.stopPropagation()">
        <p class="dialog-title">{{ dialog.title }}</p>
        <p class="dialog-msg">{{ dialog.message }}</p>
        <div class="dialog-actions">
          <button class="btn btn-ghost sm" *ngIf="dialog.confirm" (click)="dialog = null">Yoq</button>
          <button class="btn btn-red sm" (click)="confirmDialog()">{{ dialog.confirm ? 'Ha' : 'OK' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 0 12px calc(84px + env(safe-area-inset-bottom, 0px)); min-height: 100dvh; background: #0f0f0f; color: #fff; }
    .grow { flex: 1; min-width: 0; }

    .hero { display: flex; align-items: center; gap: 12px; padding: 16px 2px 12px; }
    .avatar-wrap { position: relative; flex-shrink: 0; }
    .avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid #27272a; background: #1a1a1a; display: block; }
    .avatar-vip { border-color: #f59e0b; box-shadow: 0 0 12px rgba(245,158,11,0.4); }
    .crown { position: absolute; top: -6px; right: -4px; display: flex; }
    .hero-info { min-width: 0; }
    .name { font-size: 1.02rem; font-weight: 800; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .adm-tag { margin-left: 6px; font-size: 0.5rem; font-weight: 900; background: #450a0a; color: #f87171; border: 1px solid #991b1b; padding: 1px 4px; border-radius: 4px; vertical-align: middle; }
    .handle { font-size: 0.72rem; color: #a1a1aa; margin: 2px 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .badge { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 0.64rem; font-weight: 700; }
    .badge-vip { background: linear-gradient(135deg, #f59e0b, #d97706); color: #1c1917; }
    .badge-free { background: #27272a; color: #a1a1aa; }

    .row-card { display: flex; align-items: center; gap: 10px; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; }
    .row-card svg { flex-shrink: 0; }
    .rc-t { font-size: 0.82rem; font-weight: 700; margin: 0; }
    .rc-s { font-size: 0.68rem; color: #a1a1aa; margin: 2px 0 0; }
    .ver { border-color: rgba(37,99,235,0.45); background: linear-gradient(135deg, rgba(30,64,175,0.18), #18181b); }
    .ver.ver-ok { border-color: rgba(16,185,129,0.4); background: linear-gradient(135deg, rgba(6,78,59,0.25), #18181b); }
    .adm { border-color: rgba(153,27,27,0.85); background: rgba(69,10,10,0.4); }
    .adm-badge { margin-left: 4px; font-size: 0.5rem; font-weight: 900; background: #16a34a; color: #052e16; padding: 1px 5px; border-radius: 999px; vertical-align: middle; }
    .vip { border-color: rgba(245,158,11,0.4); background: linear-gradient(135deg, rgba(245,158,11,0.12), #18181b); }
    .promo { border-color: rgba(220,38,38,0.35); background: linear-gradient(135deg, rgba(220,38,38,0.16), #18181b); }
    .warn { margin: -2px 0 8px; padding: 6px 10px; border-radius: 10px; background: rgba(220,38,38,0.14); border: 1px solid rgba(220,38,38,0.35); font-size: 0.7rem; color: #fca5a5; }

    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 2px 0 10px; }
    .stat { background: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 8px 2px; text-align: center; min-width: 0; }
    .stat-num { font-size: 0.95rem; font-weight: 800; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 2px; }
    .stat-label { font-size: 0.58rem; color: #a1a1aa; margin: 2px 0 0; }
    .amber { color: #fbbf24; }
    .orange { color: #f59e0b; }
    .green { color: #34d399; }

    .btn { border: none; border-radius: 10px; padding: 11px 16px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: transform 0.12s, opacity 0.2s; }
    .btn:active { transform: scale(0.97); }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn.sm { padding: 7px 12px; font-size: 0.74rem; flex-shrink: 0; white-space: nowrap; }
    .btn-red { background: linear-gradient(135deg, #dc2626, #b91c1c); color: #fff; }
    .btn-blue { background: #2563eb; color: #fff; }
    .btn-ghost { background: #27272a; color: #e4e4e7; }
    .btn-checkin { width: 100%; background: linear-gradient(135deg, #f59e0b, #d97706); color: #1c1917; margin-bottom: 8px; padding: 10px; }
    .msg-ok { font-size: 0.74rem; color: #34d399; margin: 0 0 8px; }

    .promo-row { display: flex; gap: 8px; margin-bottom: 10px; }
    .input { flex: 1; min-width: 0; background: #18181b; border: 1px solid #3f3f46; border-radius: 10px; padding: 8px 12px; color: #fff; font-size: 0.82rem; outline: none; }
    .input:focus { border-color: #dc2626; }

    .menu { background: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; }
    .menu-item { display: flex; align-items: center; gap: 10px; padding: 11px 12px; border-bottom: 1px solid #27272a; cursor: pointer; font-size: 0.84rem; }
    .menu-item:last-child { border-bottom: none; }
    .menu-item:active { background: #27272a; }
    .mi { width: 18px; height: 18px; flex-shrink: 0; }
    .chev { color: #52525b; font-size: 1.1rem; line-height: 1; }
    .menu-item.admin { color: #60a5fa; }
    .menu-item.danger { color: #f87171; }
    .version { text-align: center; color: #52525b; font-size: 0.66rem; margin: 12px 0 0; }

    .dialog-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.72); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 900; }
    .dialog { width: 100%; max-width: 320px; background: #18181b; border: 1px solid #3f3f46; border-radius: 16px; padding: 18px; }
    .dialog-title { font-size: 1rem; font-weight: 800; margin: 0 0 8px; }
    .dialog-msg { font-size: 0.82rem; color: #a1a1aa; margin: 0 0 16px; line-height: 1.5; }
    .dialog-actions { display: flex; gap: 8px; }
    .dialog-actions .btn { flex: 1; }
  `],
})
export class ProfileComponent implements OnInit {
  user: any = null;
  historyCount = 0;

  verifyOpen = false;

  checkinDone = false;
  checkinLoading = false;
  checkinMsg = '';

  promoInput = '';
  promoMsg = '';

  dialog: {
    title: string;
    message: string;
    confirm: boolean;
    action: (() => void) | null;
  } | null = null;

  private readonly fallbackAvatar =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="92" height="92">' +
        '<rect width="92" height="92" fill="#27272a"/>' +
        '<circle cx="46" cy="36" r="16" fill="#52525b"/>' +
        '<path d="M14 92c0-18 14-28 32-28s32 10 32 28z" fill="#52525b"/></svg>',
    );

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly storage: StorageService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.auth.user$.subscribe((u) => {
      if (u) { this.user = u; }
    });

    this.api.getMe().subscribe({
      next: (u: any) => { this.user = u; },
      error: () => undefined,
    });

    this.api.getHistory(1).subscribe({
      next: (r: any) => { this.historyCount = r?.total || 0; },
      error: () => undefined,
    });
  }

  get displayName(): string {
    if (!this.user) { return 'Foydalanuvchi'; }
    const first = this.user.firstName || '';
    const last = this.user.lastName || '';
    const full = (first + ' ' + last).trim();
    return full || 'Foydalanuvchi';
  }

  get handle(): string {
    return this.user?.username ? '@' + this.user.username : 'MANYAK TV';
  }

  get telegramId(): string {
    const id = this.user?.telegramId || this.user?.tgId || '';
    return id ? String(id) : '';
  }

  get phone(): string {
    return this.user?.phone || '';
  }

  get isVerified(): boolean {
    if (!this.user) { return false; }
    return !!(this.user.isPhoneVerified || this.user.isVerified || this.user.phone);
  }

  get avatar(): string {
    return this.user?.avatarUrl || this.fallbackAvatar;
  }

  get isVip(): boolean {
    return !!this.user?.isVip;
  }

  get isAdmin(): boolean {
    const role = this.user?.role;
    return role === 'admin' || role === 'super_admin' || !!this.user?.isAdmin;
  }

  get tokens(): number {
    return this.user?.tokens || this.user?.accessTokens || 0;
  }

  get bonusText(): string {
    const v = this.user?.bonusBalance || 0;
    try {
      return Number(v).toLocaleString('ru-RU');
    } catch {
      return String(v);
    }
  }

  get streak(): number {
    return this.user?.checkinStreak || 0;
  }

  get vipDaysLeft(): number {
    const exp = this.user?.vipExpiresAt;
    if (!exp) { return 0; }
    const diff = new Date(exp).getTime() - Date.now();
    if (diff <= 0) { return 0; }
    return Math.max(1, Math.ceil(diff / 86400000));
  }

  get isExpiringSoon(): boolean {
    const d = this.vipDaysLeft;
    return d > 0 && d <= 3;
  }

  get vipExpiresText(): string {
    const exp = this.user?.vipExpiresAt;
    if (!exp) { return ''; }
    const d = new Date(exp);
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  get checkinLabel(): string {
    if (this.checkinDone) { return 'Bugun bonus olindi'; }
    if (this.checkinLoading) { return 'Yuklanmoqda...'; }
    return 'Kunlik bonus olish';
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== this.fallbackAvatar) { img.src = this.fallbackAvatar; }
  }

  openVerify(): void {
    this.verifyOpen = true;
  }

  onVerified(u: any): void {
    this.verifyOpen = false;
    if (u) { this.user = u; }
    this.api.getMe().subscribe({
      next: (fresh: any) => { this.user = fresh; },
      error: () => undefined,
    });
  }

  checkin(): void {
    this.checkinLoading = true;
    this.checkinMsg = '';
    this.api.dailyCheckin().subscribe({
      next: (r: any) => {
        this.checkinLoading = false;
        this.checkinDone = true;
        const earned = r?.tokensEarned || 0;
        const st = r?.streak || 0;
        this.checkinMsg = '+' + earned + ' token! Ketma-ketlik: ' + st + ' kun';
        if (this.user) {
          this.user.tokens = (this.user.tokens || 0) + earned;
          this.user.checkinStreak = st;
        }
      },
      error: (err: any) => {
        this.checkinLoading = false;
        if (err?.status === 409) {
          this.checkinDone = true;
          this.checkinMsg = 'Bugun allaqachon olgansiz.';
        } else {
          this.showAlert('Xatolik', 'Bonus olinmadi. Keyinroq qayta urinib koring.');
        }
      },
    });
  }

  applyPromo(): void {
    const code = this.promoInput.trim();
    if (!code) { return; }
    this.promoMsg = '';
    this.storage.set('pending_promo', code);
    this.promoMsg = 'Kod saqlandi. Tolov sahifasida avtomatik qollanadi.';
    setTimeout(() => this.goToSubscription(), 700);
  }

  go(path: string): void {
    this.router.navigate([path]);
  }

  goToSubscription(): void {
    this.router.navigate(['/subscription']);
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  private openTg(url: string): void {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) { tg.openTelegramLink(url); }
    else { window.open(url, '_blank'); }
  }

  openBot(): void {
    this.openTg('https://t.me/Manyaktvbot');
  }

  openAdminContact(): void {
    const url = this.user?.adminContactUrl || 'https://t.me/Manyaktvbot';
    this.openTg(String(url));
  }

  clearCache(): void {
    this.dialog = {
      title: 'Keshni tozalash',
      message: 'Vaqtinchalik malumotlar va korish holati ochiriladi. Hisobingizdan chiqmaysiz.',
      confirm: true,
      action: () => {
        const keep: Array<[string, string]> = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) { continue; }
          if (key.indexOf('manyaktv_token') === 0 || key.indexOf('manyaktv_user') === 0) {
            const val = localStorage.getItem(key);
            if (val !== null) { keep.push([key, val]); }
          }
        }
        localStorage.clear();
        keep.forEach((pair) => localStorage.setItem(pair[0], pair[1]));
        this.showAlert('Tozalandi', 'Kesh muvaffaqiyatli tozalandi.');
      },
    };
  }

  logout(): void {
    this.dialog = {
      title: 'Chiqish',
      message: 'Hisobdan chiqishni xohlaysizmi?',
      confirm: true,
      action: () => {
        this.auth.logout();
        localStorage.clear();
        window.location.href = '/';
      },
    };
  }

  confirmDialog(): void {
    const action = this.dialog?.action;
    this.dialog = null;
    if (action) { action(); }
  }

  private showAlert(title: string, message: string): void {
    this.dialog = { title, message, confirm: false, action: null };
  }
}
