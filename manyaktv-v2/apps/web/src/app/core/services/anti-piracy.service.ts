import { Injectable } from '@angular/core';

/**
 * manyak-tv1 utils/antiPiracy.ts ning Angular ko'chirmasi:
 * kontekst menyu, tanlash, drag, PrintScreen, DevTools va
 * pleyer uchun platformaga mos himoya.
 */
@Injectable({ providedIn: 'root' })
export class AntiPiracyService {
  private cleanups: Array<() => void> = [];

  /** v1 detectMobilePlatform. */
  detectPlatform(): { isIOS: boolean; isAndroid: boolean; isMobile: boolean } {
    const ua = (navigator.userAgent || '').toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = ua.indexOf('android') >= 0;
    return { isIOS: isIOS, isAndroid: isAndroid, isMobile: isIOS || isAndroid };
  }

  /** v1 applyCSSProtection. */
  applyCssProtection(el: HTMLElement): void {
    if (!el) { return; }
    const st: any = el.style as any;
    st.userSelect = 'none';
    st.webkitUserSelect = 'none';
    st.webkitTouchCallout = 'none';
    st.webkitUserDrag = 'none';
    el.setAttribute('draggable', 'false');
    el.setAttribute('oncontextmenu', 'return false');
  }

  /** v1 initAntiPiracy — global himoya. Tozalash funksiyasini qaytaradi. */
  init(): () => void {
    const stop = (e: Event) => { e.preventDefault(); return false; };

    const onKey = (e: KeyboardEvent) => {
      const k = (e.key || '').toLowerCase();
      if (k === 'printscreen') {
        e.preventDefault();
        this.flashBlackout();
      }
      if (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) { e.preventDefault(); }
      if (e.ctrlKey && (k === 'u' || k === 's' || k === 'p')) { e.preventDefault(); }
      if (k === 'f12') { e.preventDefault(); }
    };

    document.addEventListener('contextmenu', stop);
    document.addEventListener('selectstart', stop);
    document.addEventListener('dragstart', stop);
    document.addEventListener('keydown', onKey);

    const cleanup = () => {
      document.removeEventListener('contextmenu', stop);
      document.removeEventListener('selectstart', stop);
      document.removeEventListener('dragstart', stop);
      document.removeEventListener('keydown', onKey);
    };
    this.cleanups.push(cleanup);
    return cleanup;
  }

  /** PrintScreen bosilganda ekranni qisqa vaqt qoraytirish. */
  private flashBlackout(): void {
    const d = document.createElement('div');
    d.style.cssText =
      'position:fixed;inset:0;background:#000;z-index:99999;display:flex;' +
      'align-items:center;justify-content:center;color:#f87171;font-weight:800;font-size:15px';
    d.textContent = 'Skrinshot taqiqlangan';
    document.body.appendChild(d);
    setTimeout(() => { if (d.parentNode) { d.parentNode.removeChild(d); } }, 1400);
  }

  /** v1 initMobileProtection — video uchun platformaga mos himoya. */
  protectVideo(video: HTMLVideoElement): () => void {
    if (!video) { return () => {}; }
    const p = this.detectPlatform();

    video.setAttribute('controlsList', 'nodownload noremoteplayback');
    video.setAttribute('disablePictureInPicture', 'true');
    video.setAttribute('playsinline', 'true');
    if (p.isIOS) { video.setAttribute('webkit-playsinline', 'true'); }
    if (p.isAndroid) { video.setAttribute('disableRemotePlayback', 'true'); }
    this.applyCssProtection(video);

    const onVisibility = () => {
      if (document.hidden && !video.paused) { video.pause(); }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const cleanup = () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
    this.cleanups.push(cleanup);
    return cleanup;
  }

  /** v1 detectSuspiciousEnvironment. */
  detectSuspiciousEnvironment(): { suspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];
    const w: any = window as any;
    if (w.outerWidth - w.innerWidth > 180 || w.outerHeight - w.innerHeight > 220) {
      reasons.push('DevTools ochiq bolishi mumkin');
    }
    if (w.navigator && w.navigator.webdriver) { reasons.push('Avtomatlashtirilgan brauzer'); }
    return { suspicious: reasons.length > 0, reasons: reasons };
  }

  destroyAll(): void {
    this.cleanups.forEach((fn) => { try { fn(); } catch { /* noop */ } });
    this.cleanups = [];
  }
}
