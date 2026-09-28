import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  template: `
    <div class="sk-row" *ngIf="variant === 'row'">
      <div class="sk-card" *ngFor="let i of slots"></div>
    </div>
    <div class="sk-grid" *ngIf="variant === 'grid'">
      <div class="sk-card sk-card-grid" *ngFor="let i of slots"></div>
    </div>
  `,
  styles: [`
    .sk-row { display: flex; gap: 10px; overflow: hidden; padding-bottom: 4px; }
    .sk-grid {
      display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px;
    }
    .sk-card {
      flex-shrink: 0; width: 132px; aspect-ratio: 2 / 3;
      border-radius: 12px; background: #18181b;
      border: 1px solid rgba(39,39,42,0.8);
      background-image: linear-gradient(90deg, #18181b 0%, #27272a 50%, #18181b 100%);
      background-size: 200% 100%;
      animation: sk-shimmer 1.4s ease-in-out infinite;
    }
    .sk-card-grid { width: 100%; }
    @keyframes sk-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class SkeletonCardComponent {
  @Input() variant: 'row' | 'grid' = 'row';
  @Input() set count(value: number) {
    this.slots = Array.from({ length: value || 6 }, (_, i) => i);
  }
  slots: number[] = [0, 1, 2, 3, 4, 5];
}
