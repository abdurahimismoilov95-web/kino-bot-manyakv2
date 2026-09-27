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
    if (this.platform.isTelegramMiniApp()) return true;
    if (!this.storage.getToken()) {
      this.router.navigate(['/browser-login']);
      return false;
    }
    if (this.auth.isAdmin) return true;
    this.router.navigate(['/browser-blocked']);
    return false;
  }
}
