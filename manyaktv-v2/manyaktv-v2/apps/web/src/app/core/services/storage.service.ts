import { Injectable } from '@angular/core';

const PREFIX = 'manyaktv_';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private get(key: string): string | null {
    return localStorage.getItem(PREFIX + key);
  }
  private set(key: string, value: string): void {
    localStorage.setItem(PREFIX + key, value);
  }
  private remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  }

  getToken(): string | null { return this.get('token'); }
  setToken(t: string): void { this.set('token', t); }
  removeToken(): void { this.remove('token'); }

  getUser(): any | null {
    const s = this.get('user');
    return s ? JSON.parse(s) : null;
  }
  setUser(u: any): void { this.set('user', JSON.stringify(u)); }

  clearAll(): void {
    ['token', 'user'].forEach((k) => this.remove(k));
  }
}
