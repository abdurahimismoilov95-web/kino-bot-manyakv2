import {
  Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { StorageService } from './core/services/storage.service';
import { PlatformService } from './core/services/platform.service';
import { ScreenProtectionService } from './core/services/screen-protection.service';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';

@Component({
  selector: 'app-root',
  template: `
    <ng-container *ngIf="isMiniApp">
      <app-splash-screen
        #splash
        *ngIf="showSplash"
        (done)="onSplashDone()"
      ></app-splash-screen>

      <ng-container *ngIf="!showSplash">
        <div class="gate" *ngIf="needsVerify">
          <app-telegram-verify
            [open]="true"
            [dismissible]="false"
            (verified)="onGateVerified()"
          ></app-telegram-verify>
        </div>

        <div class="app-shell" *ngIf="!needsVerify">
          <router-outlet></router-outlet>
          <app-bottom-nav></app-bottom-nav>
        </div>
      </ng-container>
    </ng-container>

    <ng-container *ngIf="!isMiniApp">
      <router-outlet></router-outlet>
    </ng-container>

    <app-dialog-host></app-dialog-host>
  `,
  styles: [`
    .app-shell {
      min-height: 100dvh;
      padding-bottom: 68px;
      background: #0f0f0f;
      color: #fff;
    }
    .gate { min-height: 100dvh; background: #09090b; }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('splash') splashRef!: SplashScreenComponent;

  showSplash = true;
  isMiniApp = false;

  constructor(
    private readonly auth: AuthService,
    private readonly storage: StorageService,
    private readonly platform: PlatformService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly screenGuard: ScreenProtectionService,
  ) {}

  /** Kontakt bilan tasdiqlanmaguncha ilova ichiga kirish yopiq */
  get needsVerify(): boolean {
    const u = this.auth.currentUser;
    return !u || !u.isPhoneVerified;
  }

  async ngOnInit(): Promise<void> {
    this.isMiniApp = this.platform.isTelegramMiniApp();

    if (!this.isMiniApp) {
      this.auth.markReady();
      this.handleBrowserMode();
      return;
    }

    this.screenGuard.activateGlobal();

    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready?.();
      tg.expand();
      tg.enableClosingConfirmation();
      /* Ekranni tepadan pastga surganda ilova yopilib/kichrayib ketmasin */
      if (typeof tg.disableVerticalSwipes === 'function') {
        tg.disableVerticalSwipes();
      }
      tg.setHeaderColor('#0f0f0f');
      tg.setBackgroundColor('#0f0f0f');
    }
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehavior = 'none';

    try {
      if (!this.storage.getToken()) {
        const hwid = await this.generateHwid();
        await this.auth.loginWithTelegram(hwid);
      } else {
        await this.auth.refreshUser();
      }
    } catch (err) {
      console.error('Auth failed:', err);
    } finally {
      this.auth.markReady();
    }

    setTimeout(() => {
      if (this.splashRef) { this.splashRef.hide(); }
      else { this.onSplashDone(); }
    }, 1200);

    setTimeout(() => {
      if (this.showSplash) { this.onSplashDone(); }
    }, 3500);
  }

  ngOnDestroy(): void {
    this.screenGuard.deactivateGlobal();
  }

  onSplashDone(): void {
    if (!this.showSplash) { return; }
    this.showSplash = false;
    this.cdr.detectChanges();
    this.ensureRouteActivated();
  }

  /** Kontakt tasdiqlandi: foydalanuvchini yangilab, ilovani ochamiz */
  async onGateVerified(): Promise<void> {
    await this.auth.refreshUser();
    const u = this.auth.currentUser;
    if (u && !u.isPhoneVerified) {
      (u as any).isPhoneVerified = true;
    }
    this.cdr.detectChanges();
    this.ensureRouteActivated();
  }

  private ensureRouteActivated(): void {
    const url = this.router.url && this.router.url !== '/' ? this.router.url : '/';
    setTimeout(() => {
      this.router.navigateByUrl('/__reload', { skipLocationChange: true })
        .catch(() => undefined)
        .then(() => this.router.navigateByUrl(url, { replaceUrl: true }))
        .catch(() => undefined);
    }, 0);
  }

  private handleBrowserMode(): void {
    const hasToken = !!this.storage.getToken();

    if (!hasToken) {
      this.router.navigate(['/browser-login'], { replaceUrl: true });
      return;
    }

    this.auth.refreshUser().then(() => {
      if (this.auth.isAdmin) {
        this.router.navigate(['/admin'], { replaceUrl: true });
      } else {
        this.storage.clearAll();
        this.auth.logout();
        this.router.navigate(['/browser-blocked'], { replaceUrl: true });
      }
    }).catch(() => {
      this.storage.clearAll();
      this.router.navigate(['/browser-login'], { replaceUrl: true });
    });
  }

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
