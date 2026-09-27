import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  template: `
    <div class="profile-page pb-20 px-4">
      <div class="pt-8 text-center" *ngIf="user">
        <!-- Avatar -->
        <div class="relative inline-block">
          <img [src]="user.avatarUrl || 'assets/default-avatar.png'"
               class="w-20 h-20 rounded-full border-4 border-[var(--accent)] object-cover"
               [alt]="user.firstName" />
          <span *ngIf="user.isVip" class="vip-crown">&#128081;</span>
        </div>
        <h2 class="text-xl font-bold mt-3">{{ user.firstName }} {{ user.lastName }}</h2>
        <p class="text-gray-400 text-sm">@{{ user.username || 'foydalanuvchi' }}</p>

        <!-- VIP Status -->
        <div class="vip-card mt-4" *ngIf="user.isVip">
          <span class="text-yellow-400 font-bold">&#11088; VIP Obunachi</span>
          <p class="text-xs text-gray-300 mt-1" *ngIf="user.vipExpiresAt">
            Muddati: {{ user.vipExpiresAt | date:'dd.MM.yyyy' }}
          </p>
        </div>
        <div class="free-card mt-4" *ngIf="!user.isVip">
          <p class="text-sm text-gray-400">Bepul rejada</p>
          <button class="btn-primary mt-2 text-sm" (click)="goToSubscription()">VIP olish &#128081;</button>
        </div>

        <!-- Stats -->
        <div class="stats-row mt-6">
          <div class="stat-item">
            <p class="text-2xl font-bold text-[var(--accent)]">{{ user.tokens }}</p>
            <p class="text-xs text-gray-400">Tokenlar</p>
          </div>
          <div class="stat-item">
            <p class="text-2xl font-bold text-orange-400">{{ user.checkinStreak }}</p>
            <p class="text-xs text-gray-400">Kun ketma-ket</p>
          </div>
        </div>

        <!-- Daily Check-in -->
        <button class="checkin-btn mt-5 w-full" (click)="checkin()" [disabled]="checkinDone || checkinLoading">
          {{ checkinDone ? '&#10003; Bugun tashrif buyurdingiz' : (checkinLoading ? 'Yuklanmoqda...' : '&#127881; Kunlik sovg\'a olish') }}
        </button>
        <p *ngIf="checkinMsg" class="text-sm text-green-400 mt-2">{{ checkinMsg }}</p>

        <!-- Menu -->
        <div class="menu-list mt-8 text-left">
          <div class="menu-item" (click)="goToSubscription()">
            <span>&#128081; Obuna rejalari</span><span class="text-gray-400">&rsaquo;</span>
          </div>
          <div class="menu-item" *ngIf="user.role === 'admin' || user.role === 'super_admin'" (click)="goToAdmin()">
            <span>&#9881; Admin panel</span><span class="text-gray-400">&rsaquo;</span>
          </div>
          <div class="menu-item" (click)="logout()">
            <span class="text-red-400">&#128682; Chiqish</span><span class="text-gray-400">&rsaquo;</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .vip-crown { position: absolute; top: -4px; right: -4px; font-size: 1.4rem; }
    .vip-card { background: linear-gradient(135deg, #b8860b22, #ffd70033); border: 1px solid #ffd700; border-radius: 12px; padding: 12px; }
    .free-card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 12px; }
    .stats-row { display: flex; justify-content: center; gap: 48px; }
    .stat-item { text-align: center; }
    .checkin-btn { background: var(--accent); color: #fff; border-radius: 12px; padding: 14px; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.2s; }
    .checkin-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .menu-list { border-top: 1px solid rgba(255,255,255,0.08); }
    .menu-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.06); cursor: pointer; font-size: 0.95rem; }
  `]
})
export class ProfileComponent implements OnInit {
  user: any = null;
  checkinDone = false;
  checkinLoading = false;
  checkinMsg = '';

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.auth.user$.subscribe((u) => (this.user = u));
    this.api.getMe().subscribe({ next: (u: any) => (this.user = u) });
  }

  checkin() {
    this.checkinLoading = true;
    this.api.dailyCheckin().subscribe({
      next: (r: any) => {
        this.checkinDone = true;
        this.checkinLoading = false;
        this.checkinMsg = `+${r.tokensEarned} token! Streak: ${r.streak} kun 🎉`;
        if (this.user) this.user.tokens += r.tokensEarned;
      },
      error: (err: any) => {
        this.checkinLoading = false;
        if (err.status === 409) { this.checkinDone = true; this.checkinMsg = 'Bugun allaqachon olindingiz!'; }
      },
    });
  }

  goToSubscription() { this.router.navigate(['/subscription']); }
  goToAdmin() { this.router.navigate(['/admin']); }
  logout() { localStorage.clear(); window.location.reload(); }
}
