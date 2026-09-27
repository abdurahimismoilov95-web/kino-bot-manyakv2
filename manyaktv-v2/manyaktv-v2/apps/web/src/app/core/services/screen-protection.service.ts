/**
 * ScreenProtectionService
 *
 * Ekran tasvir va video yozib olishdan himoya qiluvchi servis.
 *
 * Qatlamlar:
 *  1. CSS mix-blend-mode overlay     — screenshot'da video qora ko'rinadi
 *  2. Dinamik harakatlanuvchi watermark — foydalanuvchi Telegram ID bilan
 *  3. PrintScreen / F12 / DevTools    — klaviatura bloklash
 *  4. Tab yashirilganda               — video avtomatik to'xtatiladi
 *  5. DevTools deteksiya              — ochilib qolsa video pauza
 *  6. @media print                   — sahifa print bloklash (CSS)
 *  7. Clipboard rasm nusxalash       — bloklash
 *
 * FOYDALANISH:
 *   // AppComponent.ngOnInit:
 *   this.screenGuard.activateGlobal();
 *
 *   // HlsPlayerComponent.ngAfterViewInit:
 *   this.screenGuard.activate(videoEl, containerEl);
 *
 *   // HlsPlayerComponent.ngOnDestroy:
 *   this.screenGuard.deactivate();
 */
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ScreenProtectionService implements OnDestroy {

  // ─── Player-level state ───────────────────────────────────────────────────
  private watermarkEl:   HTMLElement | null = null;
  private overlayEl:    HTMLElement | null = null;
  private moveTimer:    ReturnType<typeof setInterval> | null = null;
  private devToolsTimer: ReturnType<typeof setInterval> | null = null;
  private videoEl:      HTMLVideoElement | null = null;

  // ─── Global-level state ───────────────────────────────────────────────────
  private globalKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private globalCopyHandler:    ((e: ClipboardEvent) => void) | null = null;
  private globalCtxHandler:     ((e: MouseEvent) => void) | null = null;
  private visibilityHandler:    (() => void) | null = null;

  // DevTools deteksiya: brauzer oynasi vs ichki o'lcham farqi (px)
  private readonly DEV_TOOLS_THRESHOLD = 160;

  constructor(
    private readonly auth: AuthService,
    private readonly ngZone: NgZone,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  //  GLOBAL HIMOYA  (AppComponent tomonidan chaqiriladi)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Butun ilova uchun global himoyani yoqadi.
   * AppComponent.ngOnInit() da bir marta chaqiriladi.
   */
  activateGlobal(): void {
    this.ngZone.runOutsideAngular(() => {
      this.hookKeyboard();
      this.hookClipboard();
      this.hookContextMenu();
      this.hookVisibility();
      this.injectPrintBlockCss();
    });
  }

  /** Global himoyani o'chiradi. AppComponent.ngOnDestroy() da chaqiriladi. */
  deactivateGlobal(): void {
    if (this.globalKeydownHandler)
      document.removeEventListener('keydown', this.globalKeydownHandler, { capture: true } as EventListenerOptions);
    if (this.globalCopyHandler)
      document.removeEventListener('copy', this.globalCopyHandler as EventListener);
    if (this.globalCtxHandler)
      document.removeEventListener('contextmenu', this.globalCtxHandler as EventListener, { capture: true } as EventListenerOptions);
    if (this.visibilityHandler)
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.globalKeydownHandler = null;
    this.globalCopyHandler    = null;
    this.globalCtxHandler     = null;
    this.visibilityHandler    = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PLAYER HIMOYA  (HlsPlayerComponent tomonidan chaqiriladi)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Video player uchun himoyani yoqadi.
   * HlsPlayerComponent.ngAfterViewInit() da chaqiriladi.
   */
  activate(videoEl: HTMLVideoElement, container: HTMLElement): void {
    this.videoEl = videoEl;
    this.ngZone.runOutsideAngular(() => {
      this.injectCssOverlay(container);
      this.injectWatermark(container);
      this.startWatermarkMovement();
      this.startDevToolsDetection();
    });
  }

  /** Player yopilganda tozalash. HlsPlayerComponent.ngOnDestroy() da chaqiriladi. */
  deactivate(): void {
    this.watermarkEl?.remove();
    this.overlayEl?.remove();
    if (this.moveTimer)      clearInterval(this.moveTimer);
    if (this.devToolsTimer)  clearInterval(this.devToolsTimer);
    this.watermarkEl  = null;
    this.overlayEl    = null;
    this.videoEl      = null;
    this.moveTimer    = null;
    this.devToolsTimer = null;
  }

  ngOnDestroy(): void {
    this.deactivate();
    this.deactivateGlobal();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  1. CSS mix-blend-mode overlay  — screenshot'da qora ko'rinadi
  // ═══════════════════════════════════════════════════════════════════════════
  /**
   * Bu element aksariyat screenshot dasturlari tomonidan
   * video layerini oq/qora qilib ko'rsatishiga sabab bo'ladi.
   * Brauzer oddiy ko'rish uchun compositing qiladi,
   * lekin getDisplayMedia / screen-grab API layerlarni alohida oladi.
   */
  private injectCssOverlay(container: HTMLElement): void {
    const el = document.createElement('div');
    el.setAttribute('data-role', 'sc-guard');
    Object.assign(el.style, {
      position:        'absolute',
      inset:           '0',
      zIndex:          '4',
      pointerEvents:   'none',
      mixBlendMode:    'difference',
      backgroundColor: 'rgba(255,255,255,0.0001)',
      backdropFilter:  'none',
    } as unknown as CSSStyleDeclaration);
    container.appendChild(el);
    this.overlayEl = el;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  2. Dinamik harakatlanuvchi watermark
  // ═══════════════════════════════════════════════════════════════════════════
  private injectWatermark(container: HTMLElement): void {
    const user = this.auth.currentUser;
    const uid  = user
      ? (user.username ? `@${user.username}` : `TG:${user.telegramId}`)
      : 'MANYAK TV';
    const now  = new Date().toLocaleDateString('uz-UZ');
    const line1 = `⚠ MANYAK TV • ${uid}`;
    const line2 = `${now} • ruxsatsiz tarqatish taqiqlangan`;

    const el = document.createElement('div');
    el.setAttribute('data-role', 'sc-watermark');
    el.innerHTML = `${line1}<br>${line2}`;

    Object.assign(el.style, {
      position:     'absolute',
      zIndex:       '6',
      pointerEvents:'none',
      color:        'rgba(255,255,255,0.11)',
      fontSize:     '11px',
      fontFamily:   'monospace',
      fontWeight:   '700',
      letterSpacing:'0.3px',
      whiteSpace:   'nowrap',
      userSelect:   'none',
      transform:    'rotate(-28deg)',
      textShadow:   '0 0 6px rgba(0,0,0,0.5)',
      lineHeight:   '1.6',
      transition:   'top 1s ease, left 1s ease',
      top:  '50%',
      left: '50%',
    } as unknown as CSSStyleDeclaration);

    container.appendChild(el);
    this.watermarkEl = el;
  }

  /** Watermark'ni har 4 sekundda tasodifiy pozitsiyaga ko'chiradi */
  private startWatermarkMovement(): void {
    // 8 ta turli pozitsiya — ketma-ket aylanib chiqadi
    const positions: Array<[string, string]> = [
      ['12%', '8%'],
      ['55%', '15%'],
      ['20%', '60%'],
      ['60%', '65%'],
      ['35%', '35%'],
      ['70%', '40%'],
      ['8%',  '75%'],
      ['72%', '8%'],
    ];
    let idx = 0;

    const move = (): void => {
      if (!this.watermarkEl) return;
      const [top, left] = positions[idx % positions.length];
      this.watermarkEl.style.top  = top;
      this.watermarkEl.style.left = left;
      idx++;
    };
    move(); // Darhol birinchi pozitsiyaga
    this.moveTimer = setInterval(move, 4_000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  3. Klaviatura bloklash
  // ═══════════════════════════════════════════════════════════════════════════
  private hookKeyboard(): void {
    // To'g'ridan bloklash kerak bo'lgan tugmalar
    const blockedKeys = new Set(['PrintScreen', 'F12']);

    // Ctrl/Meta bilan birgalikda bloklash
    const blockedWithCtrl = new Set([
      'KeyU',  // Ctrl+U  — sahifa manbasini ko'rish
      'KeyS',  // Ctrl+S  — saqlash
      'KeyP',  // Ctrl+P  — chop etish
      'KeyI',  // Ctrl+Shift+I — DevTools
      'KeyJ',  // Ctrl+Shift+J — DevTools konsol
      'KeyC',  // Ctrl+Shift+C — element inspector
    ]);

    this.globalKeydownHandler = (e: KeyboardEvent): void => {
      // PrintScreen, F12
      if (blockedKeys.has(e.key) || blockedKeys.has(e.code)) {
        e.preventDefault();
        e.stopPropagation();
        this.flashWarning();
        return;
      }
      // Ctrl+Key yoki Meta+Key
      if ((e.ctrlKey || e.metaKey) && blockedWithCtrl.has(e.code)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Ctrl+Shift+Key
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && blockedWithCtrl.has(e.code)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', this.globalKeydownHandler, { capture: true });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  4. Tab yashirilganda video pauza
  // ═══════════════════════════════════════════════════════════════════════════
  private hookVisibility(): void {
    this.visibilityHandler = (): void => {
      if (document.hidden && this.videoEl && !this.videoEl.paused) {
        this.videoEl.pause();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  5. Kontekst menyu (o'ng klik) bloklash
  // ═══════════════════════════════════════════════════════════════════════════
  private hookContextMenu(): void {
    this.globalCtxHandler = (e: MouseEvent): void => {
      const target = e.target as HTMLElement;
      // Video ustida yoki player ichida o'ng klik taqiqlangan
      if (
        target.tagName === 'VIDEO' ||
        target.closest('.player-container') ||
        target.closest('[data-role="sc-guard"]')
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('contextmenu', this.globalCtxHandler, { capture: true });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  6. Clipboard rasm nusxalashni bloklash
  // ═══════════════════════════════════════════════════════════════════════════
  private hookClipboard(): void {
    this.globalCopyHandler = (e: ClipboardEvent): void => {
      const selected = window.getSelection()?.toString() ?? '';
      // Matn tanlanmagan holda nusxalash — bloklash
      if (!selected) {
        e.preventDefault();
      }
    };
    document.addEventListener('copy', this.globalCopyHandler as EventListener);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  7. DevTools deteksiya — ochilib qolsa video to'xtatiladi
  // ═══════════════════════════════════════════════════════════════════════════
  /**
   * DevTools ochilib brauzer oynasi kichiklashganda aniqlanadi.
   * Ba'zi brauzerlar bu usulni chetlab o'tishi mumkin,
   * lekin aksariyat holatda ishlaydi.
   */
  private startDevToolsDetection(): void {
    const check = (): void => {
      const wDiff = window.outerWidth  - window.innerWidth;
      const hDiff = window.outerHeight - window.innerHeight;
      const isOpen = wDiff > this.DEV_TOOLS_THRESHOLD ||
                     hDiff > this.DEV_TOOLS_THRESHOLD;
      if (isOpen && this.videoEl && !this.videoEl.paused) {
        this.videoEl.pause();
        this.flashWarning();
      }
    };
    this.devToolsTimer = setInterval(check, 1_000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  8. Print bloklash CSS'ni dinamik inject qilish
  // ═══════════════════════════════════════════════════════════════════════════
  private injectPrintBlockCss(): void {
    if (document.getElementById('sc-print-block')) return;
    const style = document.createElement('style');
    style.id = 'sc-print-block';
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        body::after {
          visibility: visible !important;
          display: block !important;
          content: 'MANYAK TV — Bu sahifani chop etish taqiqlangan.' !important;
          font-size: 28px !important;
          color: #e50914 !important;
          text-align: center !important;
          margin-top: 40vh !important;
          font-family: sans-serif !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Yordamchi: qizil ogohlantirish miltillashi
  // ═══════════════════════════════════════════════════════════════════════════
  private flashWarning(): void {
    const flash = document.createElement('div');
    Object.assign(flash.style, {
      position:      'fixed',
      inset:         '0',
      background:    'rgba(229,9,20,0.2)',
      zIndex:        '999999',
      pointerEvents: 'none',
      opacity:       '1',
      transition:    'opacity 0.4s ease',
    } as unknown as CSSStyleDeclaration);
    document.body.appendChild(flash);
    // 200ms dan keyin fade-out
    requestAnimationFrame(() => {
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 450);
      }, 200);
    });
  }
}
