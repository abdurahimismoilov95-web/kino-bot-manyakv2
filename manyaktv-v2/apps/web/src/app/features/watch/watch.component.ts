import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';
import { PlayerConfig } from '../../shared/components/hls-player/hls-player.component';

@Component({
  selector: 'app-watch',
  template: `
    <div class="wt">
      <div class="wt-top">
        <button class="wt-back" (click)="back()">&#8592;</button>
        <span class="wt-name">{{ content?.title || 'Yuklanmoqda...' }}</span>
      </div>

      <div class="wt-stage">
        <app-hls-player
          *ngIf="playerConfig"
          [config]="playerConfig"
          (close)="back()"
          (completed)="onCompleted()">
        </app-hls-player>

        <div class="wt-locked" *ngIf="locked">
          <div class="wt-lock-icon">&#128274;</div>
          <p class="wt-lock-title">Bu kontent yopiq</p>
          <p class="wt-lock-sub">Korish uchun VIP obuna oling yoki alohida sotib oling.</p>
          <button class="wt-lock-btn" (click)="goPlans()">Tariflarni korish</button>
        </div>

        <div class="wt-loading" *ngIf="loading">Yuklanmoqda...</div>
      </div>

      <div class="wt-body" *ngIf="content">
        <h1 class="wt-title">{{ content.title }}</h1>
        <div class="wt-meta">
          <span *ngIf="content.year">{{ content.year }}</span>
          <span *ngIf="content.rating">&#9733; {{ content.rating }}</span>
          <span class="wt-badge" *ngIf="content.isPremium">PREMIUM</span>
        </div>
        <p class="wt-desc" *ngIf="content.description">{{ content.description }}</p>

        <div class="wt-actions">
          <button class="wt-fav" (click)="toggleFav()">
            {{ isFav ? '&#9829; Saqlangan' : '&#9825; Saqlash' }}
          </button>
        </div>

        <section class="wt-eps" *ngIf="episodes.length">
          <h2 class="wt-sec">Qismlar</h2>
          <div class="wt-ep-list">
            <button
              class="wt-ep"
              *ngFor="let ep of episodes; let i = index"
              [class.wt-ep-on]="activeEpisodeId === ep.id"
              (click)="playEpisode(ep)">
              <span class="wt-ep-num">{{ ep.episodeNumber || (i + 1) }}</span>
              <span class="wt-ep-title">{{ ep.title || ('Qism ' + (i + 1)) }}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .wt { background: #0f0f0f; min-height: 100dvh; padding-bottom: 90px; }
    .wt-top {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; position: sticky; top: 0; z-index: 30;
      background: rgba(15,15,15,0.95); backdrop-filter: blur(8px);
      border-bottom: 1px solid rgba(39,39,42,0.8);
    }
    .wt-back {
      width: 32px; height: 32px; border-radius: 999px;
      background: rgba(39,39,42,0.9); color: #fff;
      border: 1px solid rgba(63,63,70,0.7); font-size: 16px;
    }
    .wt-name {
      font-size: 14px; font-weight: 700; color: #fff;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .wt-stage { position: relative; background: #000; min-height: 200px; }
    .wt-loading, .wt-locked {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 8px; padding: 48px 20px;
      color: #a1a1aa; font-size: 13px; text-align: center;
    }
    .wt-lock-icon { font-size: 32px; }
    .wt-lock-title { color: #fff; font-size: 16px; font-weight: 800; margin: 0; }
    .wt-lock-sub { margin: 0; font-size: 12px; color: #a1a1aa; }
    .wt-lock-btn {
      margin-top: 8px; padding: 10px 20px; border-radius: 10px; border: none;
      background: #dc2626; color: #fff; font-weight: 800; font-size: 13px;
    }
    .wt-body { padding: 16px 14px 0; }
    .wt-title { margin: 0; font-size: 19px; font-weight: 900; color: #fff; }
    .wt-meta {
      display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
      margin-top: 8px; font-size: 12px; color: #a1a1aa;
    }
    .wt-badge {
      background: linear-gradient(to right, #f59e0b, #d97706); color: #09090b;
      font-size: 9px; font-weight: 900; padding: 2px 7px; border-radius: 4px;
    }
    .wt-desc { margin-top: 12px; font-size: 13px; line-height: 1.6; color: #d4d4d8; }
    .wt-actions { margin-top: 14px; }
    .wt-fav {
      padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 700;
      background: rgba(39,39,42,0.9); color: #f87171;
      border: 1px solid rgba(63,63,70,0.7);
    }
    .wt-sec { font-size: 15px; font-weight: 900; color: #fff; margin: 22px 0 10px; }
    .wt-ep-list { display: flex; flex-direction: column; gap: 8px; }
    .wt-ep {
      display: flex; align-items: center; gap: 12px; width: 100%;
      padding: 11px 12px; border-radius: 12px; text-align: left;
      background: rgba(24,24,27,0.9); color: #e4e4e7;
      border: 1px solid rgba(39,39,42,0.9); font-size: 13px;
    }
    .wt-ep-on { border-color: #dc2626; color: #fff; }
    .wt-ep-num {
      width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(63,63,70,0.7); font-size: 11px; font-weight: 800;
    }
    .wt-ep-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `],
})
export class WatchComponent implements OnInit {
  content: any = null;
  episodes: any[] = [];
  playerConfig: PlayerConfig | null = null;
  activeEpisodeId: string | null = null;
  loading = true;
  locked = false;
  isFav = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: ApiService,
    private readonly storage: StorageService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }

    this.api.getContentById(id).subscribe({
      next: (r: any) => {
        this.content = r && r.data ? r.data : r;
        this.episodes = (this.content && this.content.episodes) || [];
        this.isFav = !!(this.content && this.content.isFavorite);
        this.loading = false;
        this.decideAccess(id);
      },
      error: () => {
        this.loading = false;
        this.locked = true;
      },
    });
  }

  private decideAccess(id: string): void {
    const user = this.storage.getUser();
    const isVip = !!(user && user.isVip);
    const needsPay = !!(this.content && this.content.isPremium);
    const purchased = !!(this.content && this.content.hasAccess);

    if (needsPay && !isVip && !purchased) {
      this.locked = true;
      return;
    }

    if (this.episodes.length) {
      this.playEpisode(this.episodes[0]);
    } else {
      this.playerConfig = {
        contentId: id,
        title: this.content ? this.content.title : '',
        initialProgress: this.content ? this.content.watchProgress : 0,
      };
    }
  }

  playEpisode(ep: any): void {
    if (!ep || !this.content) { return; }
    this.activeEpisodeId = ep.id;
    this.playerConfig = null;
    setTimeout(() => {
      this.playerConfig = {
        contentId: this.content.id,
        episodeId: ep.id,
        title: this.content.title + ' - ' + (ep.title || ('Qism ' + ep.episodeNumber)),
        initialProgress: ep.watchProgress || 0,
      };
    }, 0);
  }

  onCompleted(): void {
    if (!this.episodes.length || !this.activeEpisodeId) { return; }
    const idx = this.episodes.findIndex((e) => e.id === this.activeEpisodeId);
    if (idx >= 0 && idx + 1 < this.episodes.length) {
      this.playEpisode(this.episodes[idx + 1]);
    }
  }

  toggleFav(): void {
    if (!this.content) { return; }
    this.api.toggleFavorite(this.content.id).subscribe({
      next: (r: any) => { this.isFav = r && typeof r.added === 'boolean' ? r.added : !this.isFav; },
      error: () => { /* noop */ },
    });
  }

  goPlans(): void { this.router.navigate(['/subscription']); }

  back(): void { this.router.navigate(['/']); }
}
