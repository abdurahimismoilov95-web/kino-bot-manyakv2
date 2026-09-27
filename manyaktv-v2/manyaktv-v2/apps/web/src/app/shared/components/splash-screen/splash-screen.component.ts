import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-splash-screen',
  animations: [
    trigger('fadeOut', [
      state('visible', style({ opacity: 1 })),
      state('hidden',  style({ opacity: 0, pointerEvents: 'none' })),
      transition('visible => hidden', animate('600ms ease-out')),
    ]),
    trigger('logoAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.7)' }),
        animate('800ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
  ],
  template: `
    <div class="splash" [@fadeOut]="state">
      <div class="splash-content" [@logoAnim]>
        <div class="logo-text">MANYAK <span class="logo-tv">TV</span></div>
        <div class="logo-tagline">Ko'ngil ochar, sifatli kino</div>
        <div class="spinner-wrap" *ngIf="loading">
          <div class="dot-spinner">
            <div class="dot" *ngFor="let d of [1,2,3]"></div>
          </div>
          <span class="loading-text">{{ loadingText }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .splash {
      position: fixed; inset: 0; z-index: 9999;
      background: radial-gradient(ellipse at center, #1a0a2e 0%, #0d0d0d 100%);
      display: flex; align-items: center; justify-content: center;
    }
    .splash-content { text-align: center; }
    .logo-text {
      font-size: 52px; font-weight: 900;
      letter-spacing: 4px; color: #fff;
      text-shadow: 0 0 40px rgba(229,9,20,0.6);
      font-family: 'Arial Black', sans-serif;
    }
    .logo-tv { color: #e50914; }
    .logo-tagline {
      color: rgba(255,255,255,0.5);
      font-size: 13px; margin-top: 8px;
      letter-spacing: 2px;
    }
    .spinner-wrap {
      margin-top: 48px;
      display: flex; flex-direction: column;
      align-items: center; gap: 16px;
    }
    .dot-spinner { display: flex; gap: 8px; }
    .dot {
      width: 10px; height: 10px;
      background: #e50914; border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    .loading-text { color: rgba(255,255,255,0.4); font-size: 12px; }
  `],
})
export class SplashScreenComponent {
  @Output() done = new EventEmitter<void>();
  state: 'visible' | 'hidden' = 'visible';
  loading = true;
  loadingText = 'Yuklanmoqda...';

  hide(): void {
    this.loading = false;
    this.state = 'hidden';
    setTimeout(() => this.done.emit(), 650);
  }
}
