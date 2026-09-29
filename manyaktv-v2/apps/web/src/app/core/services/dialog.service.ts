import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DialogOptions {
  title?: string;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
  placeholder?: string;
  inputType?: 'text' | 'number';
}

export interface DialogState {
  kind: 'alert' | 'confirm' | 'prompt';
  title: string;
  message: string;
  value: string;
  placeholder: string;
  inputType: 'text' | 'number';
  okText: string;
  cancelText: string;
  danger: boolean;
  resolve: (v: any) => void;
}

/**
 * Brauzerning confirm/prompt/alert oynalari o'rniga WebApp ichida
 * ochiladigan chiroyli tasdiqlash oynalari.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly state$ = new BehaviorSubject<DialogState | null>(null);
  private queue: DialogState[] = [];

  constructor(private readonly zone: NgZone) {
    try {
      (window as any).alert = (m?: any) => { this.alert(m == null ? '' : String(m)); };
    } catch { /* e'tiborsiz */ }
  }

  confirm(message: string, opts: DialogOptions = {}): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.open({
        kind: 'confirm',
        title: opts.title || 'Tasdiqlash',
        message: message,
        value: '',
        placeholder: '',
        inputType: 'text',
        okText: opts.okText || 'Tasdiqlash',
        cancelText: opts.cancelText || 'Bekor qilish',
        danger: !!opts.danger,
        resolve: resolve,
      });
    });
  }

  prompt(message: string, defaultValue = '', opts: DialogOptions = {}): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      this.open({
        kind: 'prompt',
        title: opts.title || 'Kiriting',
        message: message,
        value: defaultValue,
        placeholder: opts.placeholder || '',
        inputType: opts.inputType || 'text',
        okText: opts.okText || 'Tasdiqlash',
        cancelText: opts.cancelText || 'Bekor qilish',
        danger: !!opts.danger,
        resolve: resolve,
      });
    });
  }

  alert(message: string, title = 'Xabar'): Promise<void> {
    return new Promise<void>((resolve) => {
      this.open({
        kind: 'alert',
        title: title,
        message: message,
        value: '',
        placeholder: '',
        inputType: 'text',
        okText: 'OK',
        cancelText: '',
        danger: false,
        resolve: () => resolve(),
      });
    });
  }

  close(result: any): void {
    this.zone.run(() => {
      const s = this.state$.value;
      if (!s) { return; }
      const next = this.queue.shift() || null;
      this.state$.next(next);
      s.resolve(result);
    });
  }

  private open(s: DialogState): void {
    this.zone.run(() => {
      try { (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch { /* */ }
      if (this.state$.value) { this.queue.push(s); } else { this.state$.next(s); }
    });
  }
}
