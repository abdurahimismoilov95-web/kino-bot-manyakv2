/**
 * PlatformService
 *
 * Ilova qayerda ishlayotganini aniqlaydi:
 *   - isTelegramMiniApp()  → true:  Telegram Mini App (WebApp) ichida
 *   - isBrowser()          → true:  Oddiy brauzer yoki Telegram in-app browser
 *
 * KIRISH QOIDASI:
 *   - Telegram Mini App → barcha foydalanuvchilar kiradi
 *   - Brauzer           → faqat admin va super_admin kiradi
 */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PlatformService {

  /**
   * Telegram Mini App (WebApp) ichida ishlayapsizmi?
   * initData mavjud va bo'sh emas bo'lsa — ha.
   */
  isTelegramMiniApp(): boolean {
    const tg = (window as any).Telegram?.WebApp;
    return !!(tg?.initData && tg.initData.length > 0);
  }

  /** Oddiy brauzer (Telegram Mini App emas) */
  isBrowser(): boolean {
    return !this.isTelegramMiniApp();
  }

  /** Telegram platformasi (Mini App + in-app browser ikkisi ham) */
  isTelegramContext(): boolean {
    return !!(window as any).Telegram?.WebApp;
  }
}
