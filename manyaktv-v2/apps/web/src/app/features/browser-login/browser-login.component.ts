import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PlatformService } from '../../core/services/platform.service';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-browser-login',
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo"><span class="logo-m">M</span><span class="logo-text">ANYAK TV</span></div>
        <h1 class="title">Admin Panel</h1>
        <p class="subtitle">Brauzer orqali kirish faqat adminlar uchun</p>
        <div class="error-box" *ngIf="errorMsg">&#9888; {{ errorMsg }}</div>
        <form class="form" (ngSubmit)="login()" #form="ngForm">
          <div class="field">
            <label class="label">Telegram ID</label>
            <input class="input" type="text" [(ngModel)]="telegramId" name="telegramId" placeholder="123456789" autocomplete="off" required [disabled]="loading" />
          </div>
          <div class="field">
            <label class="label">Admin maxfiy kodi</label>
            <div class="input-wrap">
              <input class="input" [type]="showPass ? 'text' : 'password'" [(ngModel)]="secret" name="secret" placeholder="••••••••" required [disabled]="loading" />
              <button type="button" class="toggle-pass" (click)="showPass = !showPass">{{ showPass ? '&#128065;' : '&#128274;' }}</button>
            </div>
          </div>
          <button type="submit" class="btn-login" [disabled]="loading || !telegramId || !secret">
            <span *ngIf="!loading">Kirish</span>
            <span *ngIf="loading" class="spinner-sm"></span>
          </button>
        </form>
        <div class="divider">yoki</div>
        <a class="btn-tg" href="https://t.me/manyaktv_bot/app" target="_blank" rel="noopener noreferrer">&#9992; Telegramda ochish</a>
      </div>
    </div>
  `,
  styles: [`
    .login-container { min-height:100dvh; display:flex; align-items:center; justify-content:center; background:#0f0f0f; padding:24px; font-family:sans-serif; }
    .login-card { background:#1a1a1a; border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:36px 28px; max-width:380px; width:100%; }
    .logo { display:flex; align-items:center; gap:8px; margin-bottom:24px; }
    .logo-m { width:36px; height:36px; background:#e50914; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900; color:#fff; }
    .logo-text { font-size:18px; font-weight:800; color:#fff; }
    .title { font-size:22px; font-weight:800; color:#fff; margin:0 0 6px; }
    .subtitle { font-size:13px; color:rgba(255,255,255,0.4); margin:0 0 24px; }
    .error-box { background:rgba(229,9,20,0.12); border:1px solid rgba(229,9,20,0.3); color:#ff6b6b; padding:10px 14px; border-radius:10px; font-size:13px; margin-bottom:20px; }
    .form { display:flex; flex-direction:column; gap:16px; }
    .field { display:flex; flex-direction:column; gap:6px; }
    .label { font-size:13px; font-weight:600; color:rgba(255,255,255,0.65); }
    .input { background:#242424; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:12px 14px; color:#fff; font-size:15px; outline:none; width:100%; box-sizing:border-box; }
    .input-wrap { position:relative; }
    .input-wrap .input { padding-right:44px; }
    .toggle-pass { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:rgba(255,255,255,0.4); font-size:16px; cursor:pointer; }
    .btn-login { background:#e50914; color:#fff; border:none; border-radius:12px; padding:14px; font-size:16px; font-weight:700; cursor:pointer; margin-top:4px; width:100%; }
    .btn-login:disabled { opacity:0.5; cursor:not-allowed; }
    .spinner-sm { display:inline-block; width:18px; height:18px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; vertical-align:middle; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .divider { text-align:center; color:rgba(255,255,255,0.2); font-size:12px; margin:20px 0; }
    .btn-tg { display:flex; align-items:center; justify-content:center; gap:8px; background:#0088cc; color:#fff; font-size:14px; font-weight:600; padding:12px; border-radius:12px; text-decoration:none; }
  `],
})
export class BrowserLoginComponent implements OnInit {
  telegramId = ''; secret = ''; loading = false; showPass = false; errorMsg = '';

  constructor(
    private readonly auth: AuthService,
    private readonly platform: PlatformService,
    private readonly storage: StorageService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    if (this.platform.isTelegramMiniApp()) { this.router.navigate(['/']); return; }
    if (this.storage.getToken() && this.auth.isAdmin) this.router.navigate(['/']);
  }

  async login(): Promise<void> {
    if (!this.telegramId.trim() || !this.secret.trim()) return;
    this.loading = true; this.errorMsg = '';
    try {
      await this.auth.adminBrowserLogin(this.telegramId.trim(), this.secret.trim());
      this.router.navigate(['/admin']);
    } catch (err: any) {
      const s = err?.status ?? 0;
      this.errorMsg = s === 401 ? "Noto'g'ri Telegram ID yoki maxfiy kod"
        : s === 403 ? 'Siz admin emassiz. Kirish taqiqlangan'
        : s === 429 ? "Ko'p urinish. Bir ozdan keyin qayta urinib ko'ring"
        : 'Server xatosi. Keyinroq urinib ko\'ring';
    } finally { this.loading = false; }
  }
}
