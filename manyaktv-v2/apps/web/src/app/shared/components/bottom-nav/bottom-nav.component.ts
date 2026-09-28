import { Component } from '@angular/core';

type NavItem = {
  path: string;
  label: string;
  glyph: string;
  badge?: string;
};

/** v1 BottomNav: Asosiy / Shorts (HOT) / Qidirish / Tarix / Profil */
const NAV_ITEMS: NavItem[] = [
  { path: '/',        label: 'Asosiy',   glyph: '\u2302' },
  { path: '/shorts',  label: 'Shorts',   glyph: '\u25B6', badge: 'HOT' },
  { path: '/search',  label: 'Qidirish', glyph: '\u25CE' },
  { path: '/history', label: 'Tarix',    glyph: '\u21BB' },
  { path: '/profile', label: 'Profil',   glyph: '\u263A' },
];

@Component({
  selector: 'app-bottom-nav',
  template: `
    <nav class="nav-wrap">
      <div class="nav-pill">
        <a
          *ngFor="let item of navItems"
          class="nav-item"
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.path === '/' }">
          <span class="icon-wrap">
            <span class="glyph">{{ item.glyph }}</span>
            <span class="badge" *ngIf="item.badge">{{ item.badge }}</span>
          </span>
          <span class="label">{{ item.label }}</span>
          <span class="dot"></span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .nav-wrap {
      position: fixed;
      z-index: 120;
      left: 14px;
      right: 14px;
      bottom: calc(18px + env(safe-area-inset-bottom, 0px));
      pointer-events: none;
    }
    @media (min-width: 560px) {
      .nav-wrap {
        left: 50%;
        right: auto;
        width: 380px;
        transform: translateX(-50%);
      }
    }
    .nav-pill {
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 6px 8px;
      border-radius: 999px;
      background: rgba(18, 18, 22, 0.72);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      border: 1px solid rgba(255, 255, 255, 0.10);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55);
    }
    .nav-item {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 6px 9px;
      text-decoration: none;
      color: #a1a1aa;
      font-weight: 500;
      transition: color 0.18s, transform 0.18s;
    }
    .nav-item.active {
      color: #ef4444;
      font-weight: 800;
    }
    .nav-item:active { transform: scale(0.93); }
    .icon-wrap { position: relative; line-height: 1; }
    .glyph {
      font-size: 19px;
      line-height: 1;
      display: inline-block;
      transition: transform 0.18s;
    }
    .nav-item.active .glyph { transform: scale(1.16); }
    .badge {
      position: absolute;
      top: -7px;
      right: -15px;
      font-size: 8px;
      font-weight: 900;
      letter-spacing: 0.2px;
      background: #dc2626;
      color: #fff;
      padding: 1px 4px;
      border-radius: 999px;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
      animation: pulse 1.6s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-2px); }
    }
    .label { font-size: 10px; letter-spacing: -0.2px; }
    .dot {
      position: absolute;
      bottom: -1px;
      width: 12px;
      height: 2px;
      border-radius: 999px;
      background: transparent;
    }
    .nav-item.active .dot { background: #dc2626; }
  `],
})
export class BottomNavComponent {
  readonly navItems = NAV_ITEMS;
}
