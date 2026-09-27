/**
 * PlatformGuard
 *
 * Qoida:
 *   - Telegram Mini App ichida → hammaga ruxsat
 *   - Brauzer (oddiy yoki Telegram in-app browser) →
 *       admin/super_admin → ruxsat
 *       boshqalar       → /browser-blocked sahifasiga yo'naltirish
 */
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { PlatformService } from '../services/platform.service';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

@Injectable({ providedIn: 'root' })
export class PlatformGuard implements CanActivate {
  constructor(
    private readonly platform: PlatformService,
    private readonly auth: AuthService,
    private readonly storage: StorageService,
    private readonly router: Router,
  ) {}

  canActivate(): boolean {
    // Telegram Mini App ichida — to'siqsiz o'tish
    if (this.platform.isTelegramMiniApp()) {
      return true;
    }

    // Brauzer: token bormi?
    if (!this.storage.getToken()) {
      // Token yo'q — admin login sahifasiga
      this.router.navigate(['/browser-login']);
      return false;
    }

    // Token bor — admin ekanligini tekshirish
    if (this.auth.isAdmin) {
      return true;
    }

    // Admin emas — bloklash sahifasi
    this.router.navigate(['/browser-blocked']);
    return false;
  }
}
