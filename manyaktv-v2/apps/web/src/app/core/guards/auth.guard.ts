import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { PlatformService } from '../services/platform.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly storage: StorageService,
    private readonly auth: AuthService,
    private readonly platform: PlatformService,
    private readonly router: Router,
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    // MUHIM: ilova endi ishga tushganda token hali kelmagan boladi.
    // Auth tugashini kutmasak, navigatsiya bekor bolib ekran qora qoladi.
    if (!this.storage.getToken()) {
      await this.auth.ready;
    }

    if (!this.storage.getToken()) {
      // Telegram ichida token hali ham yoq - sahifani baribir ochamiz,
      // komponentlar API xatolarini ozi korsatadi (qora ekran bolmasin).
      if (this.platform.isTelegramMiniApp()) {
        return true;
      }
      this.router.navigate(['/browser-login']);
      return false;
    }

    const requireAdmin = route.data?.['requireAdmin'];
    if (requireAdmin && !this.auth.isAdmin) {
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
