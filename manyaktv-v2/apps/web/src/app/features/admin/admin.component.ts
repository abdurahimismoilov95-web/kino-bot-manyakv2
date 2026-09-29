import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface AdminTab { path: string; label: string; icon: string; superOnly?: boolean; }

/** v1 AdminPanel.tsx yon menyusining Angular varianti (11 bolim). */
@Component({
  selector: 'app-admin',
  template: `
    <div class="admin-layout">
      <header class="admin-header">
        <div class="hd">
          <div class="hd-l">
            <button class="back-btn" (click)="back()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h1>Admin Panel</h1>
          </div>
          <span class="admin-badge">{{ isSuper ? 'BOSH ADMIN' : 'ADMIN' }}</span>
        </div>
        <nav class="admin-tabs">
          <a
            *ngFor="let tab of tabs"
            [routerLink]="tab.path"
            routerLinkActive="admin-tab-active"
            class="admin-tab">
            <span class="t-i">{{ tab.icon }}</span>
            <span class="t-l">{{ tab.label }}</span>
          </a>
        </nav>
      </header>

      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout { min-height: 100dvh; background: #0f0f0f; color: #fff; }
    .admin-header {
      position: sticky; top: 0; z-index: 50;
      background: #18181b; border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .hd { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }
    .hd-l { display: flex; align-items: center; gap: 12px; }
    .hd-l h1 { font-size: 1rem; font-weight: 800; margin: 0; }
    .back-btn { background: none; border: none; color: #a1a1aa; cursor: pointer; display: inline-flex; padding: 0; }
    .admin-badge {
      font-size: 0.62rem; font-weight: 900; color: #f87171;
      background: rgba(220,38,38,0.14); border: 1px solid rgba(153,27,27,0.8);
      padding: 3px 8px; border-radius: 999px;
    }
    .admin-tabs {
      display: flex; gap: 6px; overflow-x: auto;
      padding: 8px 12px 10px; border-top: 1px solid rgba(255,255,255,0.05);
      scrollbar-width: none;
    }
    .admin-tabs::-webkit-scrollbar { display: none; }
    .admin-tab {
      flex: 0 0 auto; display: flex; align-items: center; gap: 5px;
      padding: 8px 12px; border-radius: 999px;
      background: #27272a; border: 1px solid #3f3f46;
      font-size: 0.72rem; font-weight: 700; color: #a1a1aa;
      text-decoration: none; white-space: nowrap;
    }
    .admin-tab-active {
      background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
      border-color: #ef4444 !important;
      color: #fff !important;
    }
    .t-i { font-size: 0.85rem; }
    .admin-content { padding-bottom: calc(40px + env(safe-area-inset-bottom, 0px)); }
  `],
})
export class AdminComponent {
  private readonly allTabs: AdminTab[] = [
    { path: 'dashboard', label: 'Statistika', icon: '\uD83D\uDCCA' },
    { path: 'content', label: 'Kino & Dramalar', icon: '\uD83C\uDFAC' },
    { path: 'users', label: 'Foydalanuvchilar', icon: '\uD83D\uDC65' },
    { path: 'catalogs', label: 'Ekran Kataloglari', icon: '\uD83D\uDDC2' },
    { path: 'payments', label: 'Tolov cheklari', icon: '\uD83D\uDCB3', superOnly: true },
    { path: 'plans', label: 'Tariflar', icon: '\uD83D\uDCC4' },
    { path: 'promos', label: 'Promokodlar', icon: '\uD83C\uDF81' },
    { path: 'admins', label: 'Adminlar', icon: '\uD83D\uDEE1' },
    { path: 'audit', label: 'Audit Jurnali', icon: '\uD83D\uDCDC' },
    { path: 'broadcast', label: 'Xabar Yuborish', icon: '\uD83D\uDCE3' },
    { path: 'settings', label: 'Bot & Havolalar', icon: '\u2699' },
  ];

  constructor(private readonly router: Router, private readonly auth: AuthService) {}

  get isSuper(): boolean {
    const u = this.auth.currentUser;
    return !!u && u.role === 'super_admin';
  }

  /** Oddiy adminlarga bosh admin bolimlari (tolov cheklari) korinmaydi */
  get tabs(): AdminTab[] {
    const sup = this.isSuper;
    return this.allTabs.filter((t) => sup || !t.superOnly);
  }

  back(): void {
    this.router.navigate(['/profile']);
  }
}
