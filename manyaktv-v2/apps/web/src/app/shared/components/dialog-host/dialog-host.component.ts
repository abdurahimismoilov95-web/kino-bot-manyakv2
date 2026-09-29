import { Component } from '@angular/core';
import { DialogService, DialogState } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-dialog-host',
  template: `
    <div class="dlg-bd" *ngIf="dlg.state$ | async as s" (click)="backdrop(s)">
      <div class="dlg" (click)="$event.stopPropagation()">
        <div class="dlg-ic" [class.red]="s.danger">
          <svg *ngIf="s.kind === 'alert'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <svg *ngIf="s.kind === 'confirm'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <svg *ngIf="s.kind === 'prompt'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
        </div>
        <p class="dlg-t">{{ s.title }}</p>
        <p class="dlg-m" *ngIf="s.message">{{ s.message }}</p>
        <input
          *ngIf="s.kind === 'prompt'"
          #inp
          class="dlg-in"
          [type]="s.inputType"
          [value]="s.value"
          [placeholder]="s.placeholder"
          (input)="setValue(s, inp.value)"
          (keyup.enter)="ok(s)" />
        <div class="dlg-a">
          <button *ngIf="s.kind !== 'alert'" class="db db-g" (click)="cancel(s)">{{ s.cancelText }}</button>
          <button class="db" [class.db-r]="s.danger" [class.db-p]="!s.danger" (click)="ok(s)">{{ s.okText }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dlg-bd { position: fixed; inset: 0; z-index: 5000; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; padding: 24px; animation: fd 0.15s ease; }
    .dlg { width: 100%; max-width: 340px; background: #18181b; border: 1px solid #3f3f46; border-radius: 18px; padding: 20px 18px 16px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.6); animation: pop 0.18s ease; }
    .dlg-ic { width: 44px; height: 44px; margin: 0 auto 10px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(245,158,11,0.15); color: #fbbf24; }
    .dlg-ic.red { background: rgba(220,38,38,0.15); color: #f87171; }
    .dlg-t { font-size: 1rem; font-weight: 800; color: #fff; margin: 0 0 6px; }
    .dlg-m { font-size: 0.84rem; color: #a1a1aa; margin: 0 0 14px; line-height: 1.5; word-break: break-word; }
    .dlg-in { width: 100%; box-sizing: border-box; background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 10px; padding: 11px 12px; color: #fff; font-size: 0.9rem; outline: none; margin-bottom: 14px; font-family: inherit; }
    .dlg-in:focus { border-color: #dc2626; }
    .dlg-a { display: flex; gap: 8px; }
    .db { flex: 1; border: none; border-radius: 12px; padding: 12px 10px; font-size: 0.85rem; font-weight: 800; cursor: pointer; color: #fff; }
    .db:active { transform: scale(0.97); }
    .db-g { background: #27272a; color: #d4d4d8; }
    .db-p { background: linear-gradient(135deg, #16a34a, #15803d); }
    .db-r { background: linear-gradient(135deg, #dc2626, #b91c1c); }
    @keyframes fd { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pop { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `],
})
export class DialogHostComponent {
  constructor(readonly dlg: DialogService) {}

  setValue(s: DialogState, v: string): void {
    s.value = v;
  }

  ok(s: DialogState): void {
    if (s.kind === 'prompt') { this.dlg.close(s.value); }
    else if (s.kind === 'confirm') { this.dlg.close(true); }
    else { this.dlg.close(undefined); }
  }

  cancel(s: DialogState): void {
    this.dlg.close(s.kind === 'prompt' ? null : false);
  }

  backdrop(s: DialogState): void {
    if (s.kind === 'alert') { this.ok(s); } else { this.cancel(s); }
  }
}
