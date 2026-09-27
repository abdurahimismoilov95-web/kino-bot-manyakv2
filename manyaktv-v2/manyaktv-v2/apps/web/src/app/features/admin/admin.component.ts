import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  template: `
    <div class="admin-layout min-h-screen bg-[var(--bg-primary)]">
      <!-- Top Nav -->
      <header class="admin-header sticky top-0 z-50 bg-[var(--bg-secondary)] border-b border-white/10">
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-3">
            <button class="text-gray-400 text-xl" (click)="back()">&#8592;</button>
            <h1 class="font-bold text-lg">&#9881; Admin Panel</h1>
          </div>
          <span class="text-xs text-[var(--accent)] font-semibold bg-[var(--accent)]/10 px-2 py-1 rounded-full">ADMIN</span>
        </div>
        <!-- Tab bar -->
        <nav class="flex border-t border-white/5">
          <a *ngFor="let tab of tabs"
             [routerLink]="tab.path"
             routerLinkActive="admin-tab-active"
             class="admin-tab flex-1 text-center py-3 text-xs font-medium text-gray-400">
            {{ tab.icon }} {{ tab.label }}
          </a>
        </nav>
      </header>

      <!-- Content -->
      <main class="admin-content pb-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-tab { transition: all 0.2s; }
    .admin-tab-active { color: var(--accent) !important; border-bottom: 2px solid var(--accent); }
  `]
})
export class AdminComponent {
  tabs = [
    { path: 'dashboard', label: 'Bosh sahifa', icon: '📊' },
    { path: 'users',     label: 'Foydalanuvchilar', icon: '👥' },
    { path: 'content',  label: 'Kontentlar', icon: '🎬' },
    { path: 'payments', label: 'To\'lovlar', icon: '💳' },
  ];

  constructor(private router: Router) {}
  back() { this.router.navigate(['/profile']); }
}
