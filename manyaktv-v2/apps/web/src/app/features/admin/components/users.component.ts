import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-users',
  template: `
    <div class="px-4 pt-4">
      <div class="relative mb-4">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">&#128269;</span>
        <input
          class="admin-input pl-9"
          type="text"
          placeholder="Ism, username, ID..."
          [(ngModel)]="query"
          (ngModelChange)="search$.next($event)"
        />
      </div>

      <div *ngIf="loading" class="text-center py-6 text-gray-400">Yuklanmoqda...</div>

      <div *ngFor="let u of users" class="user-card" [class.banned]="u.isBanned">
        <div class="flex items-center gap-3">
          <div class="avatar">{{ u.firstName?.charAt(0) }}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-semibold text-sm truncate">{{ u.firstName }} {{ u.lastName }}</p>
              <span *ngIf="u.isVip" class="badge-small vip">VIP</span>
              <span *ngIf="u.isBanned" class="badge-small ban">BAN</span>
              <span
                *ngIf="u.role === 'admin' || u.role === 'super_admin'"
                class="badge-small admin"
                >ADMIN</span
              >
            </div>
            <p class="text-xs text-gray-400">{{ '@' + (u.username || u.telegramId) }}</p>
            <p class="text-xs text-gray-500">
              Tokenlar: {{ u.tokens }} &bull; Streak: {{ u.checkinStreak }}
            </p>
          </div>
        </div>

        <div class="actions mt-3 flex flex-wrap gap-2">
          <button *ngIf="!u.isVip" class="btn-xs success" (click)="grantVip(u)">+VIP</button>
          <button *ngIf="u.isVip" class="btn-xs warning" (click)="revokeVip(u)">-VIP</button>
          <button *ngIf="!u.isBanned" class="btn-xs danger" (click)="ban(u)">BAN</button>
          <button *ngIf="u.isBanned" class="btn-xs neutral" (click)="unban(u)">UN-BAN</button>
          <button class="btn-xs neutral" (click)="resetHwid(u)">HWID reset</button>
        </div>
      </div>

      <div class="flex justify-between mt-4" *ngIf="totalPages > 1">
        <button class="btn-xs neutral" [disabled]="page <= 1" (click)="prevPage()">
          &#8592; Oldingi
        </button>
        <span class="text-sm text-gray-400">{{ page }} / {{ totalPages }}</span>
        <button class="btn-xs neutral" [disabled]="page >= totalPages" (click)="nextPage()">
          Keyingi &#8594;
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-input {
        width: 100%;
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 10px 14px;
        color: #fff;
        font-size: 0.9rem;
        outline: none;
        box-sizing: border-box;
      }
      .user-card {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 10px;
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
      .user-card.banned {
        border-color: rgba(239, 68, 68, 0.3);
        background: rgba(239, 68, 68, 0.05);
      }
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--accent, #e50914);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 1.1rem;
        flex-shrink: 0;
      }
      .badge-small {
        font-size: 0.65rem;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
      }
      .vip {
        background: rgba(255, 215, 0, 0.2);
        color: #ffd700;
      }
      .ban {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
      .admin {
        background: rgba(139, 92, 246, 0.2);
        color: #a78bfa;
      }
      .actions {
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        padding-top: 10px;
      }
      .btn-xs {
        padding: 5px 12px;
        border-radius: 8px;
        border: none;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
      }
      .success {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }
      .warning {
        background: rgba(251, 191, 36, 0.2);
        color: #fbbf24;
      }
      .danger {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
      .neutral {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
      }
    `,
  ],
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  loading = false;
  query = '';
  page = 1;
  limit = 15;
  totalPages = 1;
  search$ = new Subject<string>();

  constructor(private api: ApiService) {
    this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.page = 1;
      this.load();
    });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit };
    if (this.query.trim()) params.search = this.query.trim();
    this.api.getUsers(params).subscribe({
      next: (r: any) => {
        this.users = r.data;
        this.totalPages = r.totalPages;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  grantVip(u: any) {
    const days = prompt('Necha kun VIP berish?', '30');
    if (!days || isNaN(+days)) return;
    this.api.grantVip(u.id, +days).subscribe({
      next: (updated: any) => {
        Object.assign(u, updated);
      },
    });
  }

  revokeVip(u: any) {
    if (!confirm(u.firstName + ' dan VIP olinsinmi?')) return;
    this.api.revokeVip(u.id).subscribe({
      next: (updated: any) => {
        Object.assign(u, updated);
      },
    });
  }

  ban(u: any) {
    const reason = prompt('Ban sababi:');
    if (!reason) return;
    this.api.banUser(u.id, reason).subscribe({
      next: (updated: any) => {
        Object.assign(u, updated);
      },
    });
  }

  unban(u: any) {
    this.api.unbanUser(u.id).subscribe({
      next: (updated: any) => {
        Object.assign(u, updated);
      },
    });
  }

  resetHwid(u: any) {
    if (!confirm(u.firstName + ' qurilma boglanishini bekor qilinsinmi?')) return;
    this.api.resetHwid(u.id).subscribe({ next: () => alert('HWID ochirildi') });
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }
}
