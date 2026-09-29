import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import Hls from 'hls.js';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Shorts (mini dramalar) lentasi.
 * v1 ShortsFeed.tsx dan kochirilgan: vertikal lenta, qism almashtirish,
 * ovoz boshqaruvi, yoqtirish, qulflangan qism, qismlar paneli.
 */
@Component({
  selector: 'app-shorts',
  template: `
    <div class="shorts-root">
      <div class="center-box" *ngIf="loading">
        <div class="spinner"></div>
        <p class="muted">Yuklanmoqda...</p>
      </div>

      <div class="center-box" *ngIf="!loading && dramas.length === 0">
        <p class="empty-glyph">&#9634;</p>
        <p class="muted">Hozircha vertikal mini dramalar mavjud emas.</p>
        <button class="btn btn-ghost" (click)="goHome()">Bosh sahifaga qaytish</button>
      </div>

      <div class="stage" *ngIf="!loading && currentDrama">
        <video
          #video
          class="video"
          playsinline
          webkit-playsinline
          [muted]="isMuted"
          [poster]="abs(currentDrama.posterUrl)"
          (click)="togglePlay()"
          (loadeddata)="onVideoReady()"
          (timeupdate)="onTimeUpdate()"
          (error)="onVideoError()"
          (ended)="nextEpisode()"></video>

        <div class="lock-overlay" *ngIf="isLocked">
          <p class="lock-glyph">&#128274;</p>
          <p class="lock-title">Bu qism qulflangan</p>
          <p class="lock-sub">VIP obuna bilan barcha qismlar ochiladi</p>
          <button class="btn btn-red" (click)="goPlans()">VIP olish</button>
        </div>

        <div class="play-badge" *ngIf="!isPlaying && !isLocked" (click)="togglePlay()">
          <span>&#9654;</span>
        </div>

        <div class="top-bar">
          <button class="circle-btn" (click)="goHome()">&#8592;</button>
          <span class="top-title">Shorts</span>
          <button class="circle-btn" (click)="toggleMute()">
            {{ isMuted ? '&#9788;' : '&#9835;' }}
          </button>
        </div>

        <p class="mute-hint" *ngIf="isMuted && isPlaying" (click)="toggleMute()">
          Ovozni yoqish uchun bosing
        </p>

        <div class="side-actions">
          <button class="side-btn" (click)="toggleLike()">
            <span class="side-glyph" [class.liked]="isLiked">
              {{ isLiked ? '&#9829;' : '&#9825;' }}
            </span>
            <span class="side-label">{{ likeCount }}</span>
          </button>

          <button class="side-btn" (click)="showEpisodes = true">
            <span class="side-glyph">&#9776;</span>
            <span class="side-label">{{ episodes.length }}</span>
          </button>

          <button class="side-btn" (click)="toggleFav()">
            <span class="side-glyph">{{ isFav ? '&#9733;' : '&#9734;' }}</span>
            <span class="side-label">Saqlash</span>
          </button>
        </div>

        <div class="info-bar">
          <p class="drama-title">{{ currentDrama.title }}</p>
          <p class="episode-line" *ngIf="currentEpisode">
            {{ episodeLabel }}<span class="free-tag" *ngIf="isFreeEpisode">BEPUL</span>
          </p>
          <p class="drama-desc" *ngIf="currentDrama.description">
            {{ currentDrama.description }}
          </p>
        </div>

        <div class="progress-track">
          <div class="progress-fill" [style.width.%]="progressPercent"></div>
        </div>

        <div class="arrows">
          <button class="arrow-btn" (click)="prevEpisode()" [disabled]="!hasPrev">&#9650;</button>
          <button class="arrow-btn" (click)="nextEpisode()" [disabled]="!hasNext">&#9660;</button>
        </div>

        <div class="error-box" *ngIf="errorText">
          <p class="error-text">{{ errorText }}</p>
          <button class="btn btn-red" (click)="retry()">Qayta urinish</button>
        </div>
      </div>

      <div class="sheet-backdrop" *ngIf="showEpisodes" (click)="showEpisodes = false">
        <div class="sheet" (click)="$event.stopPropagation()">
          <div class="sheet-head">
            <p class="sheet-title">Qismlar ({{ episodes.length }})</p>
            <button class="circle-btn" (click)="showEpisodes = false">&#10005;</button>
          </div>
          <div class="ep-grid">
            <button
              *ngFor="let ep of episodes; let i = index"
              class="ep-cell"
              [class.ep-active]="i === episodeIndex"
              [class.ep-locked]="!canWatch(ep)"
              (click)="selectEpisode(i)">
              {{ ep.episodeNumber || (i + 1) }}
              <span class="ep-lock" *ngIf="!canWatch(ep)">&#128274;</span>
            </button>
          </div>
        </div>
      </div>

      <div class="drama-strip" *ngIf="!loading && dramas.length > 1">
        <button
          *ngFor="let d of dramas; let i = index"
          class="strip-item"
          [class.strip-active]="i === dramaIndex"
          (click)="selectDrama(i)">
          <img [src]="abs(d.posterUrl)" [alt]="d.title" />
        </button>
      </div>
    </div>
  `,
  styles: [`
    .shorts-root {
      position: relative;
      min-height: 100dvh;
      background: #000;
      color: #fff;
      overflow: hidden;
    }
    .center-box {
      min-height: 70dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
      text-align: center;
    }
    .muted { color: #a1a1aa; font-size: 0.86rem; margin: 0; }
    .empty-glyph { font-size: 2.6rem; margin: 0; color: #3f3f46; }
    .spinner {
      width: 34px; height: 34px;
      border: 3px solid rgba(255,255,255,0.14);
      border-top-color: #dc2626;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .stage {
      position: relative;
      width: 100%;
      height: 100dvh;
      background: #000;
    }
    .video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
      display: block;
    }
    .lock-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.82);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 8px; text-align: center; padding: 24px;
      z-index: 30;
    }
    .lock-glyph { font-size: 2.4rem; margin: 0; }
    .lock-title { font-size: 1.05rem; font-weight: 800; margin: 0; }
    .lock-sub { font-size: 0.8rem; color: #a1a1aa; margin: 0 0 10px; }
    .play-badge {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 64px; height: 64px;
      border-radius: 50%;
      background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.6rem;
      z-index: 20;
      cursor: pointer;
    }
    .top-bar {
      position: absolute;
      top: calc(10px + env(safe-area-inset-top, 0px));
      left: 12px; right: 12px;
      display: flex; align-items: center; gap: 10px;
      z-index: 25;
    }
    .top-title { flex: 1; text-align: center; font-weight: 800; font-size: 0.95rem; }
    .circle-btn {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(10px);
      color: #fff;
      font-size: 1rem;
      cursor: pointer;
    }
    .mute-hint {
      position: absolute;
      top: calc(58px + env(safe-area-inset-top, 0px));
      left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.12);
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 0.72rem;
      color: #e4e4e7;
      z-index: 25;
      cursor: pointer;
      margin: 0;
    }
    .side-actions {
      position: absolute;
      right: 10px;
      bottom: 190px;
      display: flex; flex-direction: column; gap: 16px;
      z-index: 25;
    }
    .side-btn {
      background: none; border: none; cursor: pointer;
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      color: #fff;
    }
    .side-glyph { font-size: 1.5rem; line-height: 1; }
    .side-glyph.liked { color: #ef4444; }
    .side-label { font-size: 0.65rem; color: #d4d4d8; }
    .info-bar {
      position: absolute;
      left: 14px; right: 74px;
      bottom: 104px;
      z-index: 25;
      text-shadow: 0 1px 6px rgba(0,0,0,0.9);
    }
    .drama-title { font-size: 1.02rem; font-weight: 800; margin: 0 0 3px; }
    .episode-line { font-size: 0.78rem; color: #d4d4d8; margin: 0 0 4px; }
    .free-tag {
      margin-left: 7px;
      background: #16a34a;
      color: #fff;
      font-size: 0.6rem;
      font-weight: 900;
      padding: 1px 5px;
      border-radius: 4px;
    }
    .drama-desc {
      font-size: 0.74rem;
      color: #a1a1aa;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .progress-track {
      position: absolute;
      left: 0; right: 0; bottom: 96px;
      height: 2px;
      background: rgba(255,255,255,0.16);
      z-index: 25;
    }
    .progress-fill { height: 100%; background: #dc2626; }
    .arrows {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      display: flex; flex-direction: column; gap: 8px;
      z-index: 25;
    }
    .arrow-btn {
      width: 34px; height: 34px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(0,0,0,0.42);
      color: #fff;
      cursor: pointer;
    }
    .arrow-btn:disabled { opacity: 0.3; }
    .error-box {
      position: absolute;
      left: 16px; right: 16px; top: 50%;
      transform: translateY(-50%);
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      z-index: 28;
      background: rgba(0,0,0,0.7);
      padding: 16px;
      border-radius: 14px;
    }
    .error-text {
      text-align: center;
      color: #fca5a5;
      font-size: 0.82rem;
      margin: 0;
    }
    .sheet-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: flex-end;
      z-index: 200;
    }
    .sheet {
      width: 100%;
      background: #18181b;
      border-top: 1px solid #3f3f46;
      border-radius: 20px 20px 0 0;
      padding: 16px 16px calc(24px + env(safe-area-inset-bottom, 0px));
      max-height: 62dvh;
      overflow-y: auto;
    }
    .sheet-head {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 14px;
    }
    .sheet-title { font-weight: 800; margin: 0; }
    .ep-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }
    .ep-cell {
      position: relative;
      padding: 12px 0;
      border-radius: 10px;
      border: 1px solid #3f3f46;
      background: #27272a;
      color: #e4e4e7;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .ep-active { background: #dc2626; border-color: #dc2626; color: #fff; }
    .ep-locked { opacity: 0.55; }
    .ep-lock { position: absolute; top: 2px; right: 4px; font-size: 0.6rem; }
    .drama-strip {
      position: absolute;
      left: 0; right: 0;
      bottom: calc(76px + env(safe-area-inset-bottom, 0px));
      display: flex; gap: 8px;
      padding: 0 14px;
      overflow-x: auto;
      z-index: 24;
      scrollbar-width: none;
    }
    .drama-strip::-webkit-scrollbar { display: none; }
    .strip-item {
      flex: 0 0 auto;
      width: 38px; height: 54px;
      border-radius: 7px;
      overflow: hidden;
      border: 2px solid transparent;
      background: #27272a;
      padding: 0;
      cursor: pointer;
    }
    .strip-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .strip-active { border-color: #dc2626; }
    .btn {
      border: none;
      border-radius: 12px;
      padding: 12px 20px;
      font-weight: 700;
      font-size: 0.86rem;
      cursor: pointer;
    }
    .btn-red { background: linear-gradient(135deg, #dc2626, #b91c1c); color: #fff; }
    .btn-ghost { background: #27272a; color: #e4e4e7; }
  `],
})
export class ShortsComponent implements OnInit, OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;

  dramas: any[] = [];
  dramaIndex = 0;
  episodeIndex = 0;

  loading = true;
  isPlaying = false;
  isMuted = true;
  isFav = false;
  errorText = '';
  showEpisodes = false;
  progressPercent = 0;

  private hls: Hls | null = null;
  private saveTimer: any = null;
  private likes: Record<string, boolean> = {};

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.api.getContent({ type: 'short_drama', limit: 40 }).subscribe({
      next: (res: any) => {
        this.dramas = res?.data || [];
        this.loading = false;
        if (this.dramas.length > 0) { this.loadDrama(0); }
      },
      error: () => {
        this.loading = false;
        this.errorText = 'Mini dramalarni yuklab bolmadi.';
      },
    });
  }

  ngOnDestroy(): void {
    this.saveProgress();
    if (this.saveTimer) { clearInterval(this.saveTimer); }
    this.destroyHls();
  }

  /** Nisbiy fayl manzillarini API origin bilan toldirish */
  abs(u: string): string {
    if (!u) { return ''; }
    if (/^https?:\/\//i.test(u)) { return u; }
    const origin = String(environment.apiUrl || '').replace(/\/api\/v1\/?$/, '');
    return origin + (u.charAt(0) === '/' ? u : '/' + u);
  }

  get currentDrama(): any {
    return this.dramas[this.dramaIndex] || null;
  }

  get episodes(): any[] {
    return this.currentDrama?.episodes || [];
  }

  get currentEpisode(): any {
    return this.episodes[this.episodeIndex] || null;
  }

  get episodeLabel(): string {
    const ep = this.currentEpisode;
    if (!ep) { return ''; }
    const num = ep.episodeNumber || this.episodeIndex + 1;
    return num + '-qism' + (ep.title ? ' \u00B7 ' + ep.title : '');
  }

  get isFreeEpisode(): boolean {
    return !!this.currentEpisode && this.canWatch(this.currentEpisode) && !this.auth.isVip;
  }

  get isLocked(): boolean {
    const ep = this.currentEpisode;
    return !!ep && !this.canWatch(ep);
  }

  get hasNext(): boolean {
    return this.episodeIndex < this.episodes.length - 1
      || this.dramaIndex < this.dramas.length - 1;
  }

  get hasPrev(): boolean {
    return this.episodeIndex > 0 || this.dramaIndex > 0;
  }

  get isLiked(): boolean {
    const key = this.likeKey();
    return !!this.likes[key];
  }

  get likeCount(): number {
    const base = this.currentEpisode?.likeCount || this.currentDrama?.likeCount || 0;
    return base + (this.isLiked ? 1 : 0);
  }

  canWatch(ep: any): boolean {
    if (!ep) { return false; }
    if (ep.isFree) { return true; }
    if (this.auth.isVip) { return true; }
    const d = this.currentDrama;
    if (d && !d.isPremium && !d.price) { return true; }
    const num = ep.episodeNumber || 0;
    const freeLimit = d?.freeEpisodeCount || 0;
    return num > 0 && num <= freeLimit;
  }

  selectDrama(i: number): void {
    if (i === this.dramaIndex) { return; }
    this.saveProgress();
    this.loadDrama(i);
  }

  selectEpisode(i: number): void {
    this.showEpisodes = false;
    if (i === this.episodeIndex) { return; }
    this.saveProgress();
    this.episodeIndex = i;
    this.startPlayback();
  }

  nextEpisode(): void {
    this.saveProgress();
    if (this.episodeIndex < this.episodes.length - 1) {
      this.episodeIndex += 1;
      this.startPlayback();
    } else if (this.dramaIndex < this.dramas.length - 1) {
      this.loadDrama(this.dramaIndex + 1);
    }
  }

  prevEpisode(): void {
    this.saveProgress();
    if (this.episodeIndex > 0) {
      this.episodeIndex -= 1;
      this.startPlayback();
    } else if (this.dramaIndex > 0) {
      this.loadDrama(this.dramaIndex - 1, true);
    }
  }

  retry(): void {
    this.startPlayback();
  }

  private loadDrama(index: number, lastEpisode = false): void {
    this.dramaIndex = index;
    this.episodeIndex = 0;
    this.errorText = '';
    this.progressPercent = 0;

    const drama = this.currentDrama;
    this.isFav = !!drama?.isFavorite;

    if (drama && (!drama.episodes || drama.episodes.length === 0)) {
      this.api.getContentById(drama.id).subscribe({
        next: (r: any) => {
          const full = r && r.data ? r.data : r;
          const eps: any[] = ((full && full.episodes) || []).slice().sort((a: any, b: any) => {
            const s = (a.seasonNumber || 1) - (b.seasonNumber || 1);
            return s !== 0 ? s : (a.episodeNumber || 0) - (b.episodeNumber || 0);
          });
          full.episodes = eps;
          this.dramas[index] = full;
          this.isFav = !!full?.isFavorite;
          if (lastEpisode) {
            this.episodeIndex = Math.max(eps.length - 1, 0);
          }
          this.startPlayback();
        },
        error: () => { this.errorText = 'Qismlarni yuklab bolmadi.'; },
      });
      return;
    }

    if (lastEpisode) {
      this.episodeIndex = Math.max(this.episodes.length - 1, 0);
    }
    this.startPlayback();
  }

  private whenVideo(cb: (el: HTMLVideoElement) => void, tries = 0): void {
    const el = this.videoRef?.nativeElement;
    if (el) { cb(el); return; }
    if (tries > 20) { this.errorText = 'Pleyer ochilmadi.'; return; }
    setTimeout(() => this.whenVideo(cb, tries + 1), 50);
  }

  private directUrl(): string {
    const ep = this.currentEpisode;
    const d = this.currentDrama;
    return this.abs((ep && ep.videoUrl) || (d && d.videoUrl) || '');
  }

  private startPlayback(): void {
    this.errorText = '';
    this.progressPercent = 0;
    this.destroyHls();

    const drama = this.currentDrama;
    const ep = this.currentEpisode;
    if (!drama) { return; }

    // Qismlari yoq drama - bitta video
    if (!ep) {
      const direct = this.directUrl();
      if (direct) { this.playDirect(direct); }
      else { this.errorText = 'Bu drama uchun video yuklanmagan.'; }
      return;
    }

    if (!this.canWatch(ep)) {
      this.isPlaying = false;
      return;
    }

    const direct = this.directUrl();
    const hlsReady = !!ep.hlsPath;
    if (direct && !hlsReady) { this.playDirect(direct); return; }

    this.api.getEpisodeStreamUrl(drama.id, ep.id).subscribe({
      next: (res: any) => {
        const url = res?.masterPlaylist || '';
        if (url) { this.attachStream(url, direct); }
        else if (direct) { this.playDirect(direct); }
        else { this.errorText = 'Video manzili topilmadi.'; }
      },
      error: () => {
        if (direct) { this.playDirect(direct); }
        else { this.errorText = 'Video manzilini olib bolmadi.'; }
      },
    });
  }

  private playDirect(url: string): void {
    this.destroyHls();
    this.whenVideo((el) => {
      el.src = url;
      el.load();
    });
  }

  private attachStream(url: string, fallback: string): void {
    this.whenVideo((el) => {
      if (Hls.isSupported() && url.indexOf('.m3u8') !== -1) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hls.loadSource(url);
        hls.attachMedia(el);
        hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
          if (data?.fatal) {
            this.destroyHls();
            if (fallback) { this.playDirect(fallback); }
            else { this.errorText = 'Videoni yuklashda xatolik.'; }
          }
        });
        this.hls = hls;
      } else {
        el.src = url;
      }
    });
  }

  onVideoError(): void {
    const el = this.videoRef?.nativeElement;
    if (!el || this.hls) { return; }
    if (!el.getAttribute('src')) { return; }
    this.errorText = 'Video fayl ochilmadi. Qayta urinib koring.';
  }

  onVideoReady(): void {
    const el = this.videoRef?.nativeElement;
    if (!el) { return; }
    this.errorText = '';
    el.muted = this.isMuted;
    el.play().then(() => {
      this.isPlaying = true;
      this.startSaveTimer();
    }).catch(() => {
      this.isMuted = true;
      el.muted = true;
      el.play().then(() => {
        this.isPlaying = true;
        this.startSaveTimer();
      }).catch(() => { this.isPlaying = false; });
    });
  }

  togglePlay(): void {
    const el = this.videoRef?.nativeElement;
    if (!el || this.isLocked) { return; }
    if (el.paused) {
      el.play().then(() => { this.isPlaying = true; }).catch(() => undefined);
    } else {
      el.pause();
      this.isPlaying = false;
    }
  }

  toggleMute(): void {
    const el = this.videoRef?.nativeElement;
    this.isMuted = !this.isMuted;
    if (el) { el.muted = this.isMuted; }
  }

  onTimeUpdate(): void {
    const el = this.videoRef?.nativeElement;
    if (!el || !el.duration || !isFinite(el.duration)) { return; }
    this.progressPercent = Math.min(100, (el.currentTime / el.duration) * 100);
  }

  toggleLike(): void {
    const key = this.likeKey();
    this.likes[key] = !this.likes[key];
  }

  toggleFav(): void {
    const drama = this.currentDrama;
    if (!drama) { return; }
    this.api.toggleFavorite(drama.id).subscribe({
      next: (r: any) => { this.isFav = !!r?.added; },
      error: () => undefined,
    });
  }

  goPlans(): void {
    this.router.navigate(['/subscription']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  private likeKey(): string {
    return (this.currentDrama?.id || '') + ':' + (this.currentEpisode?.id || '');
  }

  private startSaveTimer(): void {
    if (this.saveTimer) { return; }
    this.saveTimer = setInterval(() => this.saveProgress(), 5000);
  }

  private saveProgress(): void {
    const el = this.videoRef?.nativeElement;
    const drama = this.currentDrama;
    const ep = this.currentEpisode;
    if (!el || !drama || !ep) { return; }

    const t = el.currentTime;
    const d = el.duration;
    if (!isFinite(t) || !isFinite(d) || t <= 0 || d <= 0) { return; }

    this.api.saveProgress(drama.id, {
      episodeId: ep.id,
      progressSeconds: Math.floor(t),
      durationSeconds: Math.floor(d),
    }).subscribe({ next: () => undefined, error: () => undefined });
  }

  private destroyHls(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    const el = this.videoRef?.nativeElement;
    if (el) {
      el.removeAttribute('src');
      el.load();
    }
    this.isPlaying = false;
  }
}
