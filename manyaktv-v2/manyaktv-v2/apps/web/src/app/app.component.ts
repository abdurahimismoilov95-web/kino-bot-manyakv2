import {
  Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef,
} from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { StorageService } from './core/services/storage.service';
import { PlatformService } from './core/services/platform.service';
import { ScreenProtectionService } from './core/services/screen-protection.service';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <!-- Mini App rejimi: splash + nav bor -->
    <ng-container *ngIf="isMiniApp">
      <app-splash-screen
        #splash
        *ngIf="showSplash"
        (done)="onSplashDone()"
      ></app-splash-screen>

      <div class="app-shell" *ngIf="!showSplash">
        <router-outlet></router-outlet>
        <app-bottom-nav></app-bottom-nav>
      </div>
    </ng-container>

    <!-- Brauzer rejimi: nav yo'q, router hal qiladi -->
    <ng-container *ngIf="!isMiniApp">
      <router-outlet></router-outlet>
    </ng-container>
  `,
  styles: [`
    .app-shell {
      min-height: 100dvh;
      padding-bottom: 68px;
      background: #0f0f0f;
      color: #fff;
    }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('splash') splashRef!: SplashScreenComponent;

  showSplash = true;
  isMiniApp  = false;

  constructor(
    private readonly auth:         AuthService,
    private readonly storage:      StorageService,
    private readonly platform:     PlatformService,
    private readonly router:       Router,
    private readonly cdr:          ChangeDetectorRef,
    private readonly screenGuard:  ScreenProtectionService,
  ) {}

  async ngOnInit(): Promise<void> {
    // ─── 1. Platform aniqlash ─────────────────────────────────────
    this.isMiniApp = this.platform.isTelegramMiniApp();

    // ─── 2. Brauzer rejimida erta tekshiruv ──────────────────────
    if (!this.isMiniApp) {
      this.handleBrowserMode();
      return;  // Auth flow Mini App uchun
    }

    // ─── 3. Mini App rejimi ───────────────────────────────────────
    this.screenGuard.activateGlobal();

    // Telegram WebApp sozlamalari
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.enableClosingConfirmation();
      tg.setHeaderColor('#0f0f0f');
      tg.setBackgroundColor('#0f0f0f');
    }

    // Auth
    try {
      if (!this.storage.getToken()) {
        const hwid = await this.generateHwid();
        await this.auth.loginWithTelegram(hwid);
      } else {
        await this.auth.refreshUser();
      }
    } catch (err) {
      console.error('Auth failed:', err);
    }

    setTimeout(() => this.splashRef?.hide(), 1200);
  }

  ngOnDestroy(): void {
    this.screenGuard.deactivateGlobal();
  }

  onSplashDone(): void {
    this.showSplash = false;
    this.cdr.detectChanges();
  }

  // ─────────────────────────────────────────────────────────────────
  //  Brauzer rejimi: token + admin tekshiruvi
  // ─────────────────────────────────────────────────────────────────
  private handleBrowserMode(): void {
    const hasToken = !!this.storage.getToken();

    if (!hasToken) {
      // Token yo'q → admin login sahifasiga
      this.router.navigate(['/browser-login'], { replaceUrl: true });
      return;
    }

    // Token bor: foydalanuvchi ma'lumotlarini yangilash
    this.auth.refreshUser().then(() => {
      if (this.auth.isAdmin) {
        // Admin → admin panel
        this.router.navigate(['/admin'], { replaceUrl: true });
      } else {
        // Admin emas → bloklash
        this.storage.clearAll();
        this.auth.logout();
        this.router.navigate(['/browser-blocked'], { replaceUrl: true });
      }
    }).catch(() => {
      // Token eskirgan yoki xato → qayta login
      this.storage.clearAll();
      this.router.navigate(['/browser-login'], { replaceUrl: true });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  Hardware fingerprint
  // ─────────────────────────────────────────────────────────────────
  private async generateHwid(): Promise<string> {
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join('|');
    const buf = await crypto.subtle.digest(
      'SHA-256', new TextEncoder().encode(data),
    );
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('').substring(0, 32);
  }
}
