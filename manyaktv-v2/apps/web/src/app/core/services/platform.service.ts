import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  isTelegramMiniApp(): boolean {
    const tg = (window as any).Telegram?.WebApp;
    return !!(tg?.initData && tg.initData.length > 0);
  }
  isBrowser(): boolean { return !this.isTelegramMiniApp(); }
  isTelegramContext(): boolean { return !!(window as any).Telegram?.WebApp; }
}
