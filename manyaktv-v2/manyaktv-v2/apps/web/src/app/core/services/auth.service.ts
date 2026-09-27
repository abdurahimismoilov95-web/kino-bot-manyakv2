import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  telegramId: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin' | 'super_admin';
  isVip: boolean;
  vipExpiresAt: string | null;
  tokens: number;
  checkinStreak: number;
  isPhoneVerified: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = new BehaviorSubject<AuthUser | null>(null);
  readonly user$ = this._user.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly storage: StorageService,
  ) {
    const saved = this.storage.getUser();
    if (saved) this._user.next(saved);
  }

  get currentUser(): AuthUser | null {
    return this._user.getValue();
  }

  get isLoggedIn(): boolean {
    return !!this.storage.getToken();
  }

  get isAdmin(): boolean {
    const u = this.currentUser;
    return u?.role === 'admin' || u?.role === 'super_admin';
  }

  get isVip(): boolean {
    return this.currentUser?.isVip ?? false;
  }

  /** Telegram WebApp initData bilan kirish */
  async loginWithTelegram(hwid?: string): Promise<AuthUser> {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) throw new Error('Not running in Telegram WebApp');

    const initData = tg.initData;
    if (!initData) throw new Error('Telegram initData is empty');

    const res = await firstValueFrom(
      this.http.post<{ token: string; user: AuthUser }>(
        `${environment.apiUrl}/auth/verify`,
        { initData, hwid },
      ),
    );

    this.storage.setToken(res.token);
    this.storage.setUser(res.user);
    this._user.next(res.user);
    return res.user;
  }

  async refreshUser(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.http.get<AuthUser>(`${environment.apiUrl}/users/me`),
      );
      this.storage.setUser(user);
      this._user.next(user);
    } catch { /* ignore */ }
  }

  logout(): void {
    this.storage.clearAll();
    this._user.next(null);
  }

  /**
   * Brauzer orqali admin kirish.
   * Telegram Mini App mavjud bo'lmaganda ishlatiladi.
   */
  async adminBrowserLogin(telegramId: string, secret: string): Promise<AuthUser> {
    const res = await firstValueFrom(
      this.http.post<{ token: string; user: AuthUser }>(
        `${environment.apiUrl}/auth/admin-login`,
        { telegramId, secret },
      ),
    );
    this.storage.setToken(res.token);
    this.storage.setUser(res.user);
    this._user.next(res.user);
    return res.user;
  }

}
