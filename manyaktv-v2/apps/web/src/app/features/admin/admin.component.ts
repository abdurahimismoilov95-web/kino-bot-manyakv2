import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  template: `
    <div class="admin-layout">
      <header class="admin-header">
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-3">
            <button class="text-gray-400 text-xl back-btn" (click)="back()">&#8592;</button>
            <h1 class="font-bold text-lg">&#9881; Admin Panel</h1>
          </div>
          <span class="admin-badge">ADMIN</span>
        </div>
        <nav class="admin-tabs">
          <a
            *ngFor="let tab of tabs"
            [routerLink]="tab.path"
            routerLinkActive="admin-tab-active"
            class="admin-tab"
          >
            {{ tab.icon }} {{ tab.label }}
          </a>
        </nav>
      </header>

      <main class="admin-content pb-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .admin-layout {
        min-height: 100vh;
        background: var(--bg-primary, #0f0f0f);
      }
      .admin-header {
        position: sticky;
        top: 0;
        z-index: 50;
        background: var(--bg-secondary, #1a1a1a);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .admin-badge {
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--accent, #e50914);
        background: rgba(229, 9, 20, 0.12);
        padding: 4px 8px;
        border-radius: 999px;
      }
      .admin-tabs {
        display: flex;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }
      .admin-tab {
        flex: 1;
        text-align: center;
        padding: 12px 0;
        font-size: 0.72rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.5);
        text-decoration: none;
        transition: all 0.2s;
      }
      .admin-tab-active {
        color: var(--accent, #e50914) !important;
        border-bottom: 2px solid var(--accent, #e50914);
      }
      .back-btn {
        background: none;
        border: none;
        cursor: pointer;
      }
    `,
  ],
})
export class AdminComponent {
  tabs = [
    { path: 'dashboard', label: 'Bosh sahifa', icon: '\uD83D\uDCCA' },
    { path: 'users', label: 'Foydalanuvchilar', icon: '\uD83D\uDC65' },
    { path: 'content', label: 'Kontentlar', icon: '\uD83C\uDFAC' },
    { path: 'payments', label: 'Tolovlar', icon: '\uD83D\uDCB3' },
  ];

  constructor(private router: Router) {}

  back() {
    this.router.navigate(['/profile']);
  }
}
