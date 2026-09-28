import { Injectable } from '@angular/core';

const PREFIX = 'manyaktv_';

@Injectable({ providedIn: 'root' })
export class StorageService {
  /** Umumiy kalit-qiymat kirish (barcha komponentlar uchun ochiq) */
  get(key: string): string | null {
    try {
      return localStorage.getItem(PREFIX + key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(PREFIX + key, value);
    } catch {
      /* xotira toliq yoki bloklangan */
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* noop */
    }
  }

  /** Eski nomlar bilan moslik (getRaw/setRaw/removeRaw) */
  getRaw(key: string): string | null { return this.get(key); }
  setRaw(key: string, value: string): void { this.set(key, value); }
  removeRaw(key: string): void { this.remove(key); }

  /** JSON yordamchilari */
  getJson<T = any>(key: string): T | null {
    const s = this.get(key);
    if (!s) { return null; }
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }

  setJson(key: string, value: any): void {
    try {
      this.set(key, JSON.stringify(value));
    } catch {
      /* noop */
    }
  }

  getToken(): string | null { return this.get('token'); }
  setToken(t: string): void { this.set('token', t); }
  removeToken(): void { this.remove('token'); }

  getUser(): any | null { return this.getJson('user'); }
  setUser(u: any): void { this.setJson('user', u); }

  clearAll(): void {
    ['token', 'user'].forEach((k) => this.remove(k));
  }
}
