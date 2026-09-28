import { ErrorHandler, Injectable } from '@angular/core';

/**
 * manyak-tv1 ErrorBoundary.tsx ning Angular ko'chirmasi.
 * Kutilmagan xato yuz berganda oq/qora ekran o'rniga tushunarli
 * oyna ko'rsatadi va qayta yuklash imkonini beradi.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private shown = false;

  handleError(error: any): void {
    try {
      console.error('[MANYAK TV]', error);
    } catch {
      /* noop */
    }
    this.render(this.describe(error));
  }

  private describe(error: any): string {
    if (!error) { return 'Nomalum xatolik.'; }
    if (typeof error === 'string') { return error; }
    if (error.message) { return String(error.message); }
    return 'Nomalum xatolik.';
  }

  private render(message: string): void {
    if (this.shown) { return; }
    this.shown = true;

    const ovl = document.createElement('div');
    ovl.style.cssText =
      'position:fixed;inset:0;z-index:100000;background:#09090b;color:#fff;' +
      'display:flex;align-items:center;justify-content:center;padding:28px;' +
      'font-family:system-ui,-apple-system,sans-serif;text-align:center';

    const box = document.createElement('div');
    box.style.cssText = 'max-width:360px';

    const icon = document.createElement('div');
    icon.textContent = '\u26A0';
    icon.style.cssText = 'font-size:38px;color:#f59e0b;margin-bottom:14px';

    const h = document.createElement('p');
    h.textContent = 'Nimadir xato ketdi';
    h.style.cssText = 'margin:0 0 8px;font-size:17px;font-weight:900';

    const p = document.createElement('p');
    p.textContent = 'Ilovada kutilmagan xatolik yuz berdi. Sahifani qayta yuklang.';
    p.style.cssText = 'margin:0 0 6px;font-size:13.5px;color:#a1a1aa;line-height:1.55';

    const det = document.createElement('p');
    det.textContent = message;
    det.style.cssText =
      'margin:0 0 18px;font-size:11px;color:#71717a;font-family:monospace;' +
      'word-break:break-word;max-height:80px;overflow:hidden';

    const btn = document.createElement('button');
    btn.textContent = 'Qayta yuklash';
    btn.style.cssText =
      'border:none;border-radius:12px;padding:13px 26px;font-size:14px;font-weight:800;' +
      'background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;cursor:pointer';
    btn.onclick = () => window.location.reload();

    const close = document.createElement('button');
    close.textContent = 'Yopish';
    close.style.cssText =
      'margin-left:8px;border:none;border-radius:12px;padding:13px 20px;font-size:14px;' +
      'font-weight:700;background:#27272a;color:#e4e4e7;cursor:pointer';
    close.onclick = () => {
      if (ovl.parentNode) { ovl.parentNode.removeChild(ovl); }
      this.shown = false;
    };

    box.appendChild(icon);
    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(det);
    box.appendChild(btn);
    box.appendChild(close);
    ovl.appendChild(box);
    document.body.appendChild(ovl);
  }
}
