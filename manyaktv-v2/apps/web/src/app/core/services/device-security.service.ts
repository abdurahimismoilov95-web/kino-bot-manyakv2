import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

/**
 * manyak-tv1 services/deviceSecurity.ts ning Angular ko'chirmasi.
 * Qurilma barmoq izi (HWID), Telegram muhitini aniqlash va
 * qurilma ogishini baholash.
 */
@Injectable({ providedIn: 'root' })
export class DeviceSecurityService {
  private readonly FP_KEY = 'device_fingerprint';
  private cached: any = null;

  constructor(private readonly storage: StorageService) {}

  /** v1 simpleHash — 32 bitli tez hash. */
  simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash | 0;
    }
    return Math.abs(hash).toString(36);
  }

  getOSFamily(): string {
    const ua = (navigator.userAgent || '').toLowerCase();
    if (ua.indexOf('android') >= 0) { return 'android'; }
    if (/iphone|ipad|ipod/.test(ua)) { return 'ios'; }
    if (ua.indexOf('windows') >= 0) { return 'windows'; }
    if (ua.indexOf('mac') >= 0) { return 'macos'; }
    if (ua.indexOf('linux') >= 0) { return 'linux'; }
    return 'unknown';
  }

  /** v1 collectDeviceCharacteristics. */
  collect(): any {
    if (this.cached) { return this.cached; }
    const n: any = navigator as any;
    const s: any = screen as any;
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { tz = ''; }

    this.cached = {
      os: this.getOSFamily(),
      userAgent: n.userAgent || '',
      language: n.language || '',
      languages: (n.languages || []).join(','),
      platform: n.platform || '',
      hardwareConcurrency: n.hardwareConcurrency || 0,
      deviceMemory: n.deviceMemory || 0,
      maxTouchPoints: n.maxTouchPoints || 0,
      screenWidth: s ? s.width : 0,
      screenHeight: s ? s.height : 0,
      colorDepth: s ? s.colorDepth : 0,
      pixelRatio: window.devicePixelRatio || 1,
      timezone: tz,
      timezoneOffset: new Date().getTimezoneOffset(),
    };
    return this.cached;
  }

  clearCache(): void { this.cached = null; }

  /** v1 generateHWIDFromCharacteristics. */
  generateHWID(chars?: any): string {
    const c = chars || this.collect();
    const raw = [
      c.os, c.platform, c.language,
      c.hardwareConcurrency, c.deviceMemory, c.maxTouchPoints,
      c.screenWidth + 'x' + c.screenHeight, c.colorDepth, c.pixelRatio,
      c.timezone,
    ].join('|');
    return 'hwid_' + this.simpleHash(raw) + '_' + this.simpleHash(c.userAgent);
  }

  /** v1 getOrCreateDeviceFingerprint. */
  getOrCreateFingerprint(): string {
    const saved = this.storage.get(this.FP_KEY);
    if (saved) { return saved; }
    const fp = this.generateHWID();
    this.storage.set(this.FP_KEY, fp);
    return fp;
  }

  /** v1 isRunningInTelegram. */
  isRunningInTelegram(): boolean {
    const w: any = window as any;
    const tg = w && w.Telegram && w.Telegram.WebApp;
    if (!tg) { return false; }
    const hasInitData = !!(tg.initData && String(tg.initData).length > 0);
    const hasUser = !!(tg.initDataUnsafe && tg.initDataUnsafe.user);
    return hasInitData || hasUser;
  }

  /**
   * v1 evaluateDeviceDeviation — saqlangan HWID bilan hozirgi qurilma
   * qanchalik farq qilishini baholaydi.
   */
  evaluateDeviation(storedHwid: string): { changed: boolean; score: number } {
    const current = this.generateHWID();
    if (!storedHwid) { return { changed: false, score: 0 }; }
    if (storedHwid === current) { return { changed: false, score: 0 }; }
    const a = storedHwid.split('_');
    const b = current.split('_');
    let diff = 0;
    for (let i = 1; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) { diff++; }
    }
    return { changed: true, score: diff };
  }

  /** v1 checkAccessSecurity ning soddalashgan varianti. */
  checkAccess(user: any): { allowed: boolean; reason: string } {
    if (!user) { return { allowed: false, reason: 'Foydalanuvchi aniqlanmadi.' }; }
    if (user.isBanned) { return { allowed: false, reason: 'Hisobingiz bloklangan.' }; }
    const stored = user.hwid || this.storage.get('bound_hwid');
    if (stored) {
      const dev = this.evaluateDeviation(String(stored));
      if (dev.changed && dev.score > 1) {
        return { allowed: false, reason: 'Hisob boshqa qurilmaga boglangan. Admin bilan boglaning.' };
      }
    } else {
      this.storage.set('bound_hwid', this.generateHWID());
    }
    return { allowed: true, reason: '' };
  }
}
