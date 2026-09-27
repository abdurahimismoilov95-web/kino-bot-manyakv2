import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ScreenProtectionService implements OnDestroy {
  private watermarkEl: HTMLElement | null = null;
  private overlayEl: HTMLElement | null = null;
  private moveTimer: ReturnType<typeof setInterval> | null = null;
  private devToolsTimer: ReturnType<typeof setInterval> | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private globalKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private globalCopyHandler: ((e: ClipboardEvent) => void) | null = null;
  private globalCtxHandler: ((e: MouseEvent) => void) | null = null;
  private visibilityHandler: (() => void) | null = null;
  private readonly DEV_TOOLS_THRESHOLD = 160;

  constructor(private readonly auth: AuthService, private readonly ngZone: NgZone) {}

  activateGlobal(): void {
    this.ngZone.runOutsideAngular(() => {
      this.hookKeyboard();
      this.hookClipboard();
      this.hookContextMenu();
      this.hookVisibility();
      this.injectPrintBlockCss();
    });
  }

  deactivateGlobal(): void {
    if (this.globalKeydownHandler)
      document.removeEventListener('keydown', this.globalKeydownHandler, { capture: true } as EventListenerOptions);
    if (this.globalCopyHandler)
      document.removeEventListener('copy', this.globalCopyHandler as EventListener);
    if (this.globalCtxHandler)
      document.removeEventListener('contextmenu', this.globalCtxHandler as EventListener, { capture: true } as EventListenerOptions);
    if (this.visibilityHandler)
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.globalKeydownHandler = this.globalCopyHandler = this.globalCtxHandler = this.visibilityHandler = null;
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
    this.watermarkEl = this.overlayEl = this.videoEl = this.moveTimer = this.devToolsTimer = null;
  }

  ngOnDestroy(): void { this.deactivate(); this.deactivateGlobal(); }

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
    const user = this.auth.currentUser;
    const uid = user ? (user.username ? `@${user.username}` : `TG:${user.telegramId}`) : 'MANYAK TV';
    const now = new Date().toLocaleDateString('uz-UZ');
    const el = document.createElement('div');
    el.setAttribute('data-role', 'sc-watermark');
    el.innerHTML = `⚠ MANYAK TV • ${uid}<br>${now} • ruxsatsiz tarqatish taqiqlangan`;
    Object.assign(el.style, {
      position: 'absolute', zIndex: '6', pointerEvents: 'none',
      color: 'rgba(255,255,255,0.11)', fontSize: '11px',
      fontFamily: 'monospace', fontWeight: '700',
      whiteSpace: 'nowrap', userSelect: 'none',
      transform: 'rotate(-28deg)', lineHeight: '1.6',
      transition: 'top 1s ease, left 1s ease', top: '50%', left: '50%',
    } as unknown as CSSStyleDeclaration);
    container.appendChild(el);
    this.watermarkEl = el;
  }

  private startWatermarkMovement(): void {
    const positions: Array<[string, string]> = [
      ['12%','8%'],['55%','15%'],['20%','60%'],['60%','65%'],
      ['35%','35%'],['70%','40%'],['8%','75%'],['72%','8%'],
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
    this.moveTimer = setInterval(move, 4_000);
  }

  private hookKeyboard(): void {
    const blockedKeys = new Set(['PrintScreen', 'F12']);
    const blockedWithCtrl = new Set(['KeyU','KeyS','KeyP','KeyI','KeyJ','KeyC']);
    this.globalKeydownHandler = (e: KeyboardEvent): void => {
      if (blockedKeys.has(e.key) || blockedKeys.has(e.code)) {
        e.preventDefault(); e.stopPropagation(); this.flashWarning(); return;
      }
      if ((e.ctrlKey || e.metaKey) && blockedWithCtrl.has(e.code)) {
        e.preventDefault(); e.stopPropagation();
      }
    };
    document.addEventListener('keydown', this.globalKeydownHandler, { capture: true });
  }

  private hookVisibility(): void {
    this.visibilityHandler = (): void => {
      if (document.hidden && this.videoEl && !this.videoEl.paused) this.videoEl.pause();
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private hookContextMenu(): void {
    this.globalCtxHandler = (e: MouseEvent): void => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'VIDEO' || target.closest('.player-container')) {
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

  private startDevToolsDetection(): void {
    const check = (): void => {
      const isOpen = (window.outerWidth - window.innerWidth) > this.DEV_TOOLS_THRESHOLD ||
                     (window.outerHeight - window.innerHeight) > this.DEV_TOOLS_THRESHOLD;
      if (isOpen && this.videoEl && !this.videoEl.paused) {
        this.videoEl.pause(); this.flashWarning();
      }
    };
    this.devToolsTimer = setInterval(check, 1_000);
  }

  private injectPrintBlockCss(): void {
    if (document.getElementById('sc-print-block')) return;
    const style = document.createElement('style');
    style.id = 'sc-print-block';
    style.textContent = `@media print { body * { visibility: hidden !important; } body::after { visibility: visible !important; display: block !important; content: 'MANYAK TV — Bu sahifani chop etish taqiqlangan.' !important; font-size: 28px !important; color: #e50914 !important; text-align: center !important; margin-top: 40vh !important; } }`;
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
