import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-profile',
  template: `
    <div class="page">
      <!-- Gradient header -->
      <div class="hero">
        <div class="hero-glow"></div>

        <div class="avatar-wrap">
          <img
            class="avatar"
            [class.avatar-vip]="isVip"
            [src]="avatar"
            [alt]="displayName"
            (error)="onAvatarError($event)" />
          <span class="crown" *ngIf="isVip">&#128081;</span>
        </div>

        <h2 class="name">
          {{ displayName }}
          <span class="adm-tag" *ngIf="isAdmin">ADMIN</span>
        </h2>
        <p class="handle">{{ handle }}</p>
        <p class="tgid" *ngIf="telegramId">ID: {{ telegramId }}</p>

        <span class="badge" [class.badge-vip]="isVip" [class.badge-free]="!isVip">
          {{ isVip ? 'VIP obunachi' : 'Bepul reja' }}
        </span>
      </div>

      <!-- Telegram tasdiqlash (v1 ProfileView) -->
      <div class="card ver-card" [class.ver-ok]="isVerified">
        <div class="ver-top">
          <span class="ver-ico">{{ isVerified ? '&#10003;' : '&#9993;' }}</span>
          <div class="grow">
            <p class="card-title">
              {{ isVerified ? 'Hisob tasdiqlangan' : 'Hisobingiz tasdiqlanmagan' }}
            </p>
            <p class="card-sub" *ngIf="isVerified">
              Telegram: {{ phone || ('ID ' + telegramId) }}
            </p>
            <p class="card-sub" *ngIf="!isVerified">
              Botga kontaktingizni yuborib Telegram ID orqali tasdiqlang.
            </p>
          </div>
        </div>
        <button class="btn btn-blue" *ngIf="!isVerified" (click)="openVerify()">
          Telegram profil orqali tasdiqlash
        </button>
      </div>

      <!-- Admin boshqaruv paneli (v1) -->
      <div class="card adm-card" *ngIf="isAdmin">
        <div class="adm-top">
          <span class="adm-ico">&#9881;</span>
          <div class="grow">
            <p class="card-title">
              Admin Boshqaruv Paneli <span class="adm-badge">FAOL</span>
            </p>
            <p class="card-sub">Kino yuklash, tolov cheklari, foydalanuvchilar va kataloglar</p>
          </div>
        </div>
        <button class="btn btn-red" (click)="goToAdmin()">Kirish</button>
      </div>

      <!-- VIP holati -->
      <div class="card vip-card" *ngIf="isVip">
        <div class="vip-top">
          <span class="vip-icon">&#9889;</span>
          <div class="grow">
            <p class="card-title">VIP obuna faol</p>
            <p class="card-sub" *ngIf="vipDaysLeft > 0">
              {{ vipDaysLeft }} kun qoldi &middot; {{ vipExpiresText }}
            </p>
            <p class="card-sub" *ngIf="vipDaysLeft === 0">Muddatsiz</p>
          </div>
        </div>
        <div class="warn" *ngIf="isExpiringSoon">
          Obuna tugashiga kam qoldi. Uzaytirib qoying.
        </div>
        <button class="btn btn-ghost" (click)="goToSubscription()">Uzaytirish</button>
      </div>

      <div class="card promo-card" *ngIf="!isVip">
        <div class="promo-left">
          <p class="card-title">VIP obuna oling</p>
          <p class="card-sub">Barcha premium kinolar cheksiz</p>
        </div>
        <button class="btn btn-red" (click)="goToSubscription()">Olish</button>
      </div>

      <!-- Token / Bonus balansi (v1) -->
      <div class="bal">
        <div class="bal-box">
          <div class="bal-l">&#127903; Tokenlar</div>
          <div class="bal-v amber">{{ tokens }} <span class="bal-u">ta</span></div>
          <p class="bal-h">Bitta token &#8212; bitta kontentni ochadi</p>
        </div>
        <div class="bal-box">
          <div class="bal-l">&#128176; Bonus</div>
          <div class="bal-v green">{{ bonusText }} <span class="bal-u">UZS</span></div>
          <p class="bal-h">Tolovda chegirma sifatida ishlatiladi</p>
        </div>
      </div>

      <!-- Statistika -->
      <div class="stats">
        <div class="stat">
          <p class="stat-num accent">{{ tokens }}</p>
          <p class="stat-label">Tokenlar</p>
        </div>
        <div class="stat">
          <p class="stat-num orange">{{ streak }}</p>
          <p class="stat-label">Ketma-ketlik</p>
        </div>
        <div class="stat">
          <p class="stat-num green">{{ historyCount }}</p>
          <p class="stat-label">Korilgan</p>
        </div>
      </div>

      <!-- Kunlik bonus -->
      <button
        class="btn btn-checkin"
        (click)="checkin()"
        [disabled]="checkinDone || checkinLoading">
        {{ checkinLabel }}
      </button>
      <p class="msg-ok" *ngIf="checkinMsg">{{ checkinMsg }}</p>

      <!-- Promokod -->
      <div class="card promo-input-card">
        <p class="card-title">Promokod</p>
        <div class="promo-row">
          <input
            class="input"
            type="text"
            placeholder="Kodni kiriting"
            [(ngModel)]="promoInput"
            [ngModelOptions]="{ standalone: true }" />
          <button class="btn btn-red small" (click)="applyPromo()">Faollash</button>
        </div>
        <p class="msg-ok" *ngIf="promoMsg">{{ promoMsg }}</p>
      </div>

      <!-- Menyu -->
      <div class="menu">
        <div class="menu-item" (click)="goToSubscription()">
          <span class="mi-icon">&#128081;</span>
          <span class="grow">Obuna rejalari</span>
          <span class="chev">&#8250;</span>
        </div>

        <div class="menu-item" (click)="go('/history')">
          <span class="mi-icon">&#9711;</span>
          <span class="grow">Korish tarixi</span>
          <span class="chev">&#8250;</span>
        </div>

        <div class="menu-item" (click)="go('/favorites')">
          <span class="mi-icon">&#9829;</span>
          <span class="grow">Saqlangan</span>
          <span class="chev">&#8250;</span>
        </div>

        <div class="menu-item" (click)="openBot()">
          <span class="mi-icon">&#9993;</span>
          <span class="grow">Telegram bot</span>
          <span class="chev">&#8250;</span>
        </div>

        <div class="menu-item" (click)="openAdminContact()">
          <span class="mi-icon">&#9758;</span>
          <span class="grow">Adminga murojaat (Yordam)</span>
          <span class="chev">&#8250;</span>
        </div>

        <div class="menu-item" (click)="clearCache()">
          <span class="mi-icon">&#9851;</span>
          <span class="grow">Keshni tozalash</span>
          <span class="chev">&#8250;</span>
        </div>

        <div class="menu-item admin" *ngIf="isAdmin" (click)="goToAdmin()">
          <span class="mi-icon">&#9881;</span>
          <span class="grow">Admin panel</span>
          <span class="chev">&#8250;</span>
        </div>

        <div class="menu-item danger" (click)="logout()">
          <span class="mi-icon">&#10005;</span>
          <span class="grow">Chiqish</span>
          <span class="chev">&#8250;</span>
        </div>
      </div>

      <p class="version">MANYAK TV v2.0.0</p>
    </div>

    <!-- Telegram tasdiqlash oynasi -->
    <app-telegram-verify
      [open]="verifyOpen"
      [dismissible]="true"
      (verified)="onVerified($event)"
      (closed)="verifyOpen = false"></app-telegram-verify>

    <!-- Dialog (Telegram WebApp confirm ishlamaydi) -->
    <div class="dialog-backdrop" *ngIf="dialog" (click)="dialog = null">
      <div class="dialog" (click)="$event.stopPropagation()">
        <p class="dialog-title">{{ dialog.title }}</p>
        <p class="dialog-msg">{{ dialog.message }}</p>
        <div class="dialog-actions">
          <button class="btn btn-ghost small" *ngIf="dialog.confirm" (click)="dialog = null">
            Yoq
          </button>
          <button class="btn btn-red small" (click)="confirmDialog()">
            {{ dialog.confirm ? 'Ha' : 'OK' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      padding: 0 16px calc(90px + env(safe-area-inset-bottom, 0px));
      min-height: 100dvh;
      background: #0f0f0f;
      color: #fff;
    }
    .grow { flex: 1; min-width: 0; }

    /* Hero */
    .hero {
      position: relative;
      text-align: center;
      padding: 32px 0 20px;
      overflow: hidden;
    }
    .hero-glow {
      position: absolute;
      top: -80px; left: 50%;
      transform: translateX(-50%);
      width: 260px; height: 260px;
      background: radial-gradient(circle, rgba(229,9,20,0.28), transparent 68%);
      pointer-events: none;
    }
    .avatar-wrap { position: relative; display: inline-block; }
    .avatar {
      width: 92px; height: 92px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #27272a;
      background: #1a1a1a;
    }
    .avatar-vip { border-color: #f59e0b; box-shadow: 0 0 18px rgba(245,158,11,0.45); }
    .crown { position: absolute; top: -6px; right: -6px; font-size: 1.5rem; }
    .name { font-size: 1.25rem; font-weight: 800; margin: 12px 0 2px; }
    .adm-tag {
      margin-left: 6px; font-size: 0.55rem; font-weight: 900;
      background: #450a0a; color: #f87171; border: 1px solid #991b1b;
      padding: 2px 5px; border-radius: 5px; vertical-align: middle;
      letter-spacing: 0.06em;
    }
    .handle { font-size: 0.85rem; color: #a1a1aa; margin: 0; }
    .tgid { font-size: 0.7rem; color: #71717a; margin: 3px 0 0; font-family: monospace; }
    .badge {
      display: inline-block;
      margin-top: 10px;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .badge-vip { background: linear-gradient(135deg, #f59e0b, #d97706); color: #1c1917; }
    .badge-free { background: #27272a; color: #a1a1aa; }

    /* Cards */
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .card-title { font-size: 0.95rem; font-weight: 700; margin: 0; }
    .card-sub { font-size: 0.78rem; color: #a1a1aa; margin: 4px 0 0; }

    .ver-card {
      border-color: rgba(37,99,235,0.45);
      background: linear-gradient(135deg, rgba(30,64,175,0.18), #18181b);
    }
    .ver-card.ver-ok {
      border-color: rgba(16,185,129,0.45);
      background: linear-gradient(135deg, rgba(6,78,59,0.25), #18181b);
    }
    .ver-top { display: flex; align-items: center; gap: 12px; }
    .ver-ico { font-size: 1.3rem; }
    .btn-blue { width: 100%; margin-top: 12px; background: #2563eb; color: #fff; }

    .adm-card {
      border-color: rgba(153,27,27,0.85);
      background: rgba(69,10,10,0.45);
    }
    .adm-top { display: flex; align-items: center; gap: 12px; }
    .adm-ico { font-size: 1.3rem; color: #f87171; }
    .adm-badge {
      margin-left: 6px; font-size: 0.55rem; font-weight: 900;
      background: #16a34a; color: #052e16; padding: 2px 6px; border-radius: 999px;
      vertical-align: middle;
    }
    .adm-card .btn { width: 100%; margin-top: 12px; }

    .vip-card { border-color: rgba(245,158,11,0.4); background: linear-gradient(135deg, rgba(245,158,11,0.12), #18181b); }
    .vip-top { display: flex; align-items: center; gap: 12px; }
    .vip-icon { font-size: 1.4rem; }
    .warn {
      margin-top: 10px;
      padding: 8px 10px;
      border-radius: 10px;
      background: rgba(220,38,38,0.14);
      border: 1px solid rgba(220,38,38,0.35);
      font-size: 0.76rem;
      color: #fca5a5;
    }
    .promo-card {
      display: flex; align-items: center; gap: 12px;
      background: linear-gradient(135deg, rgba(220,38,38,0.18), #18181b);
      border-color: rgba(220,38,38,0.35);
    }
    .promo-left { flex: 1; }

    /* Balans */
    .bal { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
    .bal-box {
      background: rgba(9,9,11,0.85);
      border: 1px solid #27272a;
      border-radius: 14px;
      padding: 12px;
    }
    .bal-l { font-size: 0.7rem; color: #a1a1aa; }
    .bal-v { font-size: 1.15rem; font-weight: 900; margin-top: 4px; }
    .bal-u { font-size: 0.62rem; color: #a1a1aa; font-weight: 700; }
    .bal-h { font-size: 0.6rem; color: #71717a; margin: 4px 0 0; line-height: 1.4; }
    .amber { color: #fbbf24; }

    /* Stats */
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 4px 0 14px;
    }
    .stat {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 14px;
      padding: 14px 6px;
      text-align: center;
    }
    .stat-num { font-size: 1.35rem; font-weight: 800; margin: 0; }
    .stat-label { font-size: 0.68rem; color: #a1a1aa; margin: 3px 0 0; }
    .accent { color: #ef4444; }
    .orange { color: #f59e0b; }
    .green  { color: #34d399; }

    /* Buttons */
    .btn {
      border: none;
      border-radius: 12px;
      padding: 13px 18px;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.12s, opacity 0.2s;
    }
    .btn:active { transform: scale(0.97); }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn.small { padding: 10px 14px; font-size: 0.8rem; }
    .btn-red { background: linear-gradient(135deg, #dc2626, #b91c1c); color: #fff; }
    .btn-ghost { background: #27272a; color: #e4e4e7; }
    .btn-checkin {
      width: 100%;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #1c1917;
      margin-bottom: 8px;
    }
    .msg-ok { font-size: 0.8rem; color: #34d399; margin: 0 0 12px; }

    /* Promo input */
    .promo-row { display: flex; gap: 8px; margin-top: 10px; }
    .input {
      flex: 1;
      background: #0f0f0f;
      border: 1px solid #3f3f46;
      border-radius: 12px;
      padding: 11px 13px;
      color: #fff;
      font-size: 0.88rem;
      outline: none;
    }
    .input:focus { border-color: #dc2626; }

    /* Menu */
    .menu {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      overflow: hidden;
      margin-top: 4px;
    }
    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 15px 16px;
      border-bottom: 1px solid #27272a;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .menu-item:last-child { border-bottom: none; }
    .menu-item:active { background: #27272a; }
    .mi-icon { width: 22px; text-align: center; font-size: 1.05rem; }
    .chev { color: #52525b; font-size: 1.2rem; }
    .menu-item.admin { color: #60a5fa; }
    .menu-item.danger { color: #f87171; }

    .version { text-align: center; color: #52525b; font-size: 0.7rem; margin: 18px 0 0; }

    /* Dialog */
    .dialog-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.72);
      display: flex; align-items: center; justify-content: center;
      padding: 24px; z-index: 900;
    }
    .dialog {
      width: 100%; max-width: 320px;
      background: #18181b;
      border: 1px solid #3f3f46;
      border-radius: 18px;
      padding: 20px;
    }
    .dialog-title { font-size: 1rem; font-weight: 800; margin: 0 0 8px; }
    .dialog-msg { font-size: 0.84rem; color: #a1a1aa; margin: 0 0 18px; line-height: 1.5; }
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

  // Getterlar
  get displayName(): string {
    if (!this.user) { return 'Foydalanuvchi'; }
    const first = this.user.firstName || '';
    const last = this.user.lastName || '';
    const full = (first + ' ' + last).trim();
    return full || 'Foydalanuvchi';
  }

  get handle(): string {
    return this.user?.username ? '@' + this.user.username : 'MANYAK TV foydalanuvchisi';
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

  // Amallar
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
