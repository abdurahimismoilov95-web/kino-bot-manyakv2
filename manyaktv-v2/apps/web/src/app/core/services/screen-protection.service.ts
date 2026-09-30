import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Ekran himoyasi.
 * - Ilova fonga o'tganda / fokus yo'qolganda / ekran yozish so'ralganda
 *   butun ekran QORA bo'ladi va video to'xtaydi.
 * - PrintScreen va skrinshot tugmalarida qora ekran + bufer tozalanadi.
 * - Pleyerda: foydalanuvchi ID li harakatlanuvchi watermark, devtools aniqlash.
 * Eslatma: veb-sahifa telefon/kompyuter tizimining ekran yozuvchisini
 * 100% to'sa olmaydi - bu faqat native ilovalarda (FLAG_SECURE) mumkin.
 */
@Injectable({ providedIn: 'root' })
export class ScreenProtectionService implements OnDestroy {
  private watermarkEl: HTMLElement | null = null;
  private overlayEl: HTMLElement | null = null;
  private blackoutEl: HTMLElement | null = null;
  private readonly reasons = new Set<string>();
  private moveTimer: ReturnType<typeof setInterval> | null = null;
  private devToolsTimer: ReturnType<typeof setInterval> | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private globalKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private globalKeyupHandler: ((e: KeyboardEvent) => void) | null = null;
  private globalCopyHandler: ((e: ClipboardEvent) => void) | null = null;
  private globalCtxHandler: ((e: MouseEvent) => void) | null = null;
  private visibilityHandler: (() => void) | null = null;
  private blurHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;
  private pageHideHandler: (() => void) | null = null;
  private pageShowHandler: (() => void) | null = null;
  private tgDeactivated: (() => void) | null = null;
  private tgActivated: (() => void) | null = null;
  private readonly DEV_TOOLS_THRESHOLD = 160;

  constructor(private readonly auth: AuthService, private readonly ngZone: NgZone) {}

  activateGlobal(): void {
    this.ngZone.runOutsideAngular(() => {
      this.hookKeyboard();
      this.hookClipboard();
      this.hookContextMenu();
      this.hookVisibility();
      this.hookFocus();
      this.hookTelegram();
      this.hookScreenCapture();
      this.injectPrintBlockCss();
    });
  }

  deactivateGlobal(): void {
    if (this.globalKeydownHandler)
      document.removeEventListener('keydown', this.globalKeydownHandler, { capture: true } as EventListenerOptions);
    if (this.globalKeyupHandler)
      document.removeEventListener('keyup', this.globalKeyupHandler, { capture: true } as EventListenerOptions);
    if (this.globalCopyHandler)
      document.removeEventListener('copy', this.globalCopyHandler as EventListener);
    if (this.globalCtxHandler)
      document.removeEventListener('contextmenu', this.globalCtxHandler as EventListener, { capture: true } as EventListenerOptions);
    if (this.visibilityHandler)
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    if (this.blurHandler) window.removeEventListener('blur', this.blurHandler);
    if (this.focusHandler) window.removeEventListener('focus', this.focusHandler);
    if (this.pageHideHandler) window.removeEventListener('pagehide', this.pageHideHandler);
    if (this.pageShowHandler) window.removeEventListener('pageshow', this.pageShowHandler);
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && typeof tg.offEvent === 'function') {
        if (this.tgDeactivated) tg.offEvent('deactivated', this.tgDeactivated);
        if (this.tgActivated) tg.offEvent('activated', this.tgActivated);
      }
    } catch { /* e'tiborsiz */ }
    this.globalKeydownHandler = null;
    this.globalKeyupHandler = null;
    this.globalCopyHandler = null;
    this.globalCtxHandler = null;
    this.visibilityHandler = null;
    this.blurHandler = null;
    this.focusHandler = null;
    this.pageHideHandler = null;
    this.pageShowHandler = null;
    this.tgDeactivated = null;
    this.tgActivated = null;
    this.reasons.clear();
    this.refreshBlackout();
  }

  activate(videoEl: HTMLVideoElement, container: HTMLElement): void {
    this.videoEl = videoEl;
    this.ngZone.runOutsideAngular(() => {
      this.injectCssOverlay(container);
      this.injectWatermark(container);
      this.startWatermarkMovement();
      this.startDevToolsDetection();
    });
  }

  deactivate(): void {
    this.watermarkEl?.remove();
    this.overlayEl?.remove();
    if (this.moveTimer) clearInterval(this.moveTimer);
    if (this.devToolsTimer) clearInterval(this.devToolsTimer);
    if (this.videoEl) { this.videoEl.style.visibility = ''; }
    this.watermarkEl = null;
    this.overlayEl = null;
    this.videoEl = null;
    this.moveTimer = null;
    this.devToolsTimer = null;
    this.reasons.delete('devtools');
    this.reasons.delete('blur');
    this.refreshBlackout();
  }

  ngOnDestroy(): void { this.deactivate(); this.deactivateGlobal(); }

  // ---------------- QORA EKRAN ----------------
  private ensureBlackout(): HTMLElement {
    if (this.blackoutEl && document.body.contains(this.blackoutEl)) return this.blackoutEl;
    const el = document.createElement('div');
    el.id = 'sc-blackout';
    el.innerHTML = '<div style="text-align:center">MANYAK TV<br><span style="font-size:11px;font-weight:600;letter-spacing:1px">Kontent himoyalangan</span></div>';
    Object.assign(el.style, {
      position: 'fixed', inset: '0', background: '#000', zIndex: '2147483647',
      display: 'none', alignItems: 'center', justifyContent: 'center',
      color: '#3f3f46', fontFamily: 'system-ui, sans-serif', fontWeight: '900',
      fontSize: '15px', letterSpacing: '3px', userSelect: 'none',
    } as unknown as CSSStyleDeclaration);
    el.addEventListener('click', () => {
      this.reasons.delete('blur');
      this.reasons.delete('print');
      this.refreshBlackout();
    });
    document.body.appendChild(el);
    this.blackoutEl = el;
    return el;
  }

  private showBlackout(reason: string): void {
    this.reasons.add(reason);
    this.refreshBlackout();
  }

  private hideBlackout(reason: string): void {
    this.reasons.delete(reason);
    this.refreshBlackout();
  }

  private refreshBlackout(): void {
    if (!document.body) return;
    const on = this.reasons.size > 0;
    if (!on && !this.blackoutEl) return;
    const el = this.ensureBlackout();
    el.style.display = on ? 'flex' : 'none';
    if (this.videoEl) { this.videoEl.style.visibility = on ? 'hidden' : ''; }
  }

  private pauseVideo(): void {
    try { if (this.videoEl && !this.videoEl.paused) this.videoEl.pause(); } catch { /* */ }
  }

  private clearClipboard(): void {
    try {
      const c: any = (navigator as any).clipboard;
      if (c && typeof c.writeText === 'function') { c.writeText('').catch(() => undefined); }
    } catch { /* */ }
  }

  private flashBlack(ms: number): void {
    this.pauseVideo();
    this.clearClipboard();
    this.showBlackout('print');
    setTimeout(() => this.hideBlackout('print'), ms);
  }

  // ---------------- HODISALAR ----------------
  private hookVisibility(): void {
    this.visibilityHandler = (): void => {
      if (document.hidden) {
        this.pauseVideo();
        this.showBlackout('hidden');
      } else {
        setTimeout(() => this.hideBlackout('hidden'), 250);
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.pageHideHandler = (): void => { this.pauseVideo(); this.showBlackout('hidden'); };
    this.pageShowHandler = (): void => { setTimeout(() => this.hideBlackout('hidden'), 250); };
    window.addEventListener('pagehide', this.pageHideHandler);
    window.addEventListener('pageshow', this.pageShowHandler);
  }

  /** Video ochiq turganda oyna fokusni yo'qotsa (masalan yozuvchi dastur ochilsa) - qora ekran */
  private hookFocus(): void {
    this.blurHandler = (): void => {
      if (this.videoEl) { this.pauseVideo(); this.showBlackout('blur'); }
    };
    this.focusHandler = (): void => { setTimeout(() => this.hideBlackout('blur'), 200); };
    window.addEventListener('blur', this.blurHandler);
    window.addEventListener('focus', this.focusHandler);
  }

  /** Telegram Mini App fonga o'tganda (boshqa ilovaga, bildirishnoma paneliga) */
  private hookTelegram(): void {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (!tg || typeof tg.onEvent !== 'function') return;
      this.tgDeactivated = (): void => { this.pauseVideo(); this.showBlackout('tg'); };
      this.tgActivated = (): void => { setTimeout(() => this.hideBlackout('tg'), 250); };
      tg.onEvent('deactivated', this.tgDeactivated);
      tg.onEvent('activated', this.tgActivated);
    } catch { /* eski Telegram versiyasi */ }
  }

  /** Brauzer ichidan ekran yozish (getDisplayMedia) so'ralsa - qora ekran */
  private hookScreenCapture(): void {
    try {
      const md: any = navigator.mediaDevices;
      if (!md || typeof md.getDisplayMedia !== 'function' || md.__mtvGuard) return;
      const orig = md.getDisplayMedia.bind(md);
      md.getDisplayMedia = (...args: any[]) => {
        this.pauseVideo();
        this.showBlackout('capture');
        return orig(...args).then(
          (stream: any) => {
            try {
              stream.getTracks().forEach((t: any) => {
                t.addEventListener('ended', () => this.hideBlackout('capture'));
              });
            } catch { /* */ }
            return stream;
          },
          (err: any) => {
            this.hideBlackout('capture');
            throw err;
          },
        );
      };
      md.__mtvGuard = true;
    } catch { /* */ }
  }

  private hookKeyboard(): void {
    const shotKeys = new Set(['PrintScreen', 'Snapshot']);
    const blockedKeys = new Set(['F12']);
    const blockedWithCtrl = new Set(['KeyU', 'KeyS', 'KeyP', 'KeyI', 'KeyJ', 'KeyC']);
    const macShot = new Set(['Digit3', 'Digit4', 'Digit5', 'Digit6', 'KeyS']);
    this.globalKeydownHandler = (e: KeyboardEvent): void => {
      if (shotKeys.has(e.key) || shotKeys.has(e.code)) {
        e.preventDefault(); e.stopPropagation(); this.flashBlack(2500); return;
      }
      if (e.shiftKey && (e.metaKey || e.ctrlKey) && macShot.has(e.code)) {
        this.flashBlack(3000);
      }
      if (blockedKeys.has(e.key) || blockedKeys.has(e.code)) {
        e.preventDefault(); e.stopPropagation(); this.flashWarning(); return;
      }
      if ((e.ctrlKey || e.metaKey) && blockedWithCtrl.has(e.code)) {
        const t = e.target as HTMLElement;
        const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
        if (!typing) { e.preventDefault(); e.stopPropagation(); }
      }
    };
    this.globalKeyupHandler = (e: KeyboardEvent): void => {
      if (shotKeys.has(e.key) || shotKeys.has(e.code)) { this.flashBlack(2500); }
    };
    document.addEventListener('keydown', this.globalKeydownHandler, { capture: true });
    document.addEventListener('keyup', this.globalKeyupHandler, { capture: true });
  }

  private hookContextMenu(): void {
    this.globalCtxHandler = (e: MouseEvent): void => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'VIDEO' || target.tagName === 'IMG' || target.closest('.player-container'))) {
        e.preventDefault(); e.stopPropagation();
      }
    };
    document.addEventListener('contextmenu', this.globalCtxHandler, { capture: true });
  }

  private hookClipboard(): void {
    this.globalCopyHandler = (e: ClipboardEvent): void => {
      if (!window.getSelection()?.toString()) e.preventDefault();
    };
    document.addEventListener('copy', this.globalCopyHandler as EventListener);
  }

  // ---------------- PLEYER ----------------
  private injectCssOverlay(container: HTMLElement): void {
    const el = document.createElement('div');
    el.setAttribute('data-role', 'sc-guard');
    Object.assign(el.style, {
      position: 'absolute', inset: '0', zIndex: '4',
      pointerEvents: 'none', mixBlendMode: 'difference',
      backgroundColor: 'rgba(255,255,255,0.0001)',
    } as unknown as CSSStyleDeclaration);
    container.appendChild(el);
    this.overlayEl = el;
  }

  private injectWatermark(container: HTMLElement): void {
    const user: any = this.auth.currentUser;
    const uid = user ? (user.username ? '@' + user.username : 'TG:' + user.telegramId) : 'MANYAK TV';
    const now = new Date().toLocaleDateString('uz-UZ');
    const el = document.createElement('div');
    el.setAttribute('data-role', 'sc-watermark');
    el.textContent = 'MANYAK TV | ' + uid + ' | ' + now;
    Object.assign(el.style, {
      position: 'absolute', zIndex: '6', pointerEvents: 'none',
      color: 'rgba(255,255,255,0.09)', fontSize: '10px',
      fontFamily: 'system-ui, sans-serif', fontWeight: '600',
      whiteSpace: 'nowrap', userSelect: 'none',
      transition: 'top 1.2s ease, left 1.2s ease', top: '50%', left: '50%',
    } as unknown as CSSStyleDeclaration);
    container.appendChild(el);
    this.watermarkEl = el;
  }

  private startWatermarkMovement(): void {
    const positions: Array<[string, string]> = [
      ['12%', '8%'], ['55%', '15%'], ['20%', '60%'], ['60%', '65%'],
      ['35%', '35%'], ['70%', '40%'], ['8%', '75%'], ['72%', '8%'],
    ];
    let idx = 0;
    const move = (): void => {
      if (!this.watermarkEl) return;
      const [top, left] = positions[idx % positions.length];
      this.watermarkEl.style.top = top;
      this.watermarkEl.style.left = left;
      idx++;
    };
    move();
    this.moveTimer = setInterval(move, 4000);
  }

  private startDevToolsDetection(): void {
    const check = (): void => {
      if (!window.outerWidth || !window.outerHeight) return;
      const isOpen = (window.outerWidth - window.innerWidth) > this.DEV_TOOLS_THRESHOLD ||
                     (window.outerHeight - window.innerHeight) > this.DEV_TOOLS_THRESHOLD;
      if (isOpen) {
        this.pauseVideo();
        this.showBlackout('devtools');
      } else if (this.reasons.has('devtools')) {
        this.hideBlackout('devtools');
      }
    };
    this.devToolsTimer = setInterval(check, 1000);
  }

  private injectPrintBlockCss(): void {
    if (document.getElementById('sc-print-block')) return;
    const style = document.createElement('style');
    style.id = 'sc-print-block';
    style.textContent =
      '@media print { body * { visibility: hidden !important; } body::after { visibility: visible !important; display: block !important; content: "MANYAK TV - chop etish taqiqlangan" !important; font-size: 28px !important; color: #e50914 !important; text-align: center !important; margin-top: 40vh !important; } }' +
      ' video, img { -webkit-touch-callout: none; -webkit-user-drag: none; }';
    document.head.appendChild(style);
  }

  private flashWarning(): void {
    const flash = document.createElement('div');
    Object.assign(flash.style, {
      position: 'fixed', inset: '0', background: 'rgba(229,9,20,0.2)',
      zIndex: '999999', pointerEvents: 'none', opacity: '1', transition: 'opacity 0.4s ease',
    } as unknown as CSSStyleDeclaration);
    document.body.appendChild(flash);
    requestAnimationFrame(() => {
      setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 450); }, 200);
    });
  }
}
