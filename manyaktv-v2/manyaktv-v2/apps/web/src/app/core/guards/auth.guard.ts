import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly storage: StorageService,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.storage.getToken()) {
      // Telegram WebApp auth page'ga yuborilmaydi,
      // app.component splash screen'da auth qiladi
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
