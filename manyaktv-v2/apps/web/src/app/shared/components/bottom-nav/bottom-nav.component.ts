import { Component } from '@angular/core';

const NAV_ITEMS = [
  { path: '/', icon: '\uD83C\uDFE0', label: 'Bosh sahifa' },
  { path: '/search', icon: '\uD83D\uDD0D', label: 'Qidirish' },
  { path: '/history', icon: '\uD83D\uDD52', label: 'Tarix' },
  { path: '/favorites', icon: '\u2764\uFE0F', label: 'Saqlangan' },
  { path: '/profile', icon: '\uD83D\uDC64', label: 'Profil' },
];

@Component({
  selector: 'app-bottom-nav',
  template: `
    <nav class="bottom-nav">
      <a
        *ngFor="let item of navItems"
        [routerLink]="item.path"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: item.path === '/' }"
        class="nav-item"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </a>
    </nav>
  `,
  styles: [
    `
      .bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 68px;
        background: rgba(15, 15, 15, 0.95);
        backdrop-filter: blur(16px);
        display: flex;
        align-items: center;
        padding: 0 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        z-index: 100;
        padding-bottom: env(safe-area-inset-bottom, 0);
      }
      .nav-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: 8px 4px;
        text-decoration: none;
        color: rgba(255, 255, 255, 0.45);
        transition: color 0.2s, transform 0.15s;
      }
      .nav-item.active {
        color: #e50914;
        transform: translateY(-2px);
      }
      .nav-icon {
        font-size: 22px;
        line-height: 1;
      }
      .nav-label {
        font-size: 10px;
        font-weight: 500;
      }
    `,
  ],
})
export class BottomNavComponent {
  readonly navItems = NAV_ITEMS;
}
