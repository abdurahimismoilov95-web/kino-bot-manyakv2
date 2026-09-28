import { Injectable } from '@angular/core';

/**
 * manyak-tv1 utils/customDialogs.ts ning Angular ko'chirmasi.
 * Brauzer alert/confirm o'rniga ilova uslubidagi oynalar.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  alert(message: string, title?: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.build({
        title: title || 'Xabar',
        message: message,
        confirmText: 'Yopish',
        cancelText: '',
        onDone: () => resolve(),
      });
    });
  }

  confirm(message: string, title?: string, confirmText?: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.build({
        title: title || 'Tasdiqlang',
        message: message,
        confirmText: confirmText || 'Ha',
        cancelText: 'Bekor',
        onDone: (ok: boolean) => resolve(ok),
      });
    });
  }

  toast(message: string, kind?: string): void {
    const el = document.createElement('div');
    const color = kind === 'error' ? '#f87171' : (kind === 'success' ? '#34d399' : '#e4e4e7');
    el.style.cssText =
      'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:9999;' +
      'background:#18181b;border:1px solid #3f3f46;border-radius:999px;' +
      'padding:10px 18px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.5);' +
      'color:' + color + ';opacity:0;transition:opacity .2s';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '1'; }, 10);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => { if (el.parentNode) { el.parentNode.removeChild(el); } }, 250);
    }, 2600);
  }

  private build(opts: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onDone: (ok: boolean) => void;
  }): void {
    const ovl = document.createElement('div');
    ovl.style.cssText =
      'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.82);' +
      'backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px';

    const card = document.createElement('div');
    card.style.cssText =
      'width:100%;max-width:360px;background:#18181b;border:1px solid #3f3f46;' +
      'border-radius:18px;padding:20px;color:#fff;font-family:inherit';

    const h = document.createElement('p');
    h.textContent = opts.title;
    h.style.cssText = 'margin:0 0 8px;font-size:15px;font-weight:800';

    const m = document.createElement('p');
    m.textContent = opts.message;
    m.style.cssText = 'margin:0 0 18px;font-size:13.5px;line-height:1.55;color:#d4d4d8';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';

    const close = (ok: boolean) => {
      if (ovl.parentNode) { ovl.parentNode.removeChild(ovl); }
      opts.onDone(ok);
    };

    if (opts.cancelText) {
      const c = document.createElement('button');
      c.textContent = opts.cancelText;
      c.style.cssText =
        'border:none;border-radius:11px;padding:10px 16px;font-size:13px;font-weight:700;' +
        'background:#27272a;color:#e4e4e7;cursor:pointer';
      c.onclick = () => close(false);
      row.appendChild(c);
    }

    const ok = document.createElement('button');
    ok.textContent = opts.confirmText;
    ok.style.cssText =
      'border:none;border-radius:11px;padding:10px 18px;font-size:13px;font-weight:800;' +
      'background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;cursor:pointer';
    ok.onclick = () => close(true);
    row.appendChild(ok);

    card.appendChild(h);
    card.appendChild(m);
    card.appendChild(row);
    ovl.appendChild(card);
    ovl.onclick = (e: MouseEvent) => { if (e.target === ovl) { close(false); } };
    document.body.appendChild(ovl);
  }
}
