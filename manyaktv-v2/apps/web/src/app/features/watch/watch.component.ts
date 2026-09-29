import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Hls from 'hls.js';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';
import { environment } from '../../../environments/environment';

/** manyak-tv1 VideoPlayerModal.tsx dizayni: yuklangan mp4 + HLS, kichik ID watermark, qismlar grid */
@Component({
  selector: 'app-watch',
  template: `
    <div class="wt">
      <div class="wt-stage" [class.wt-vert]="isVertical" (contextmenu)="$event.preventDefault()">
        <video #videoEl class="wt-video" [class.wt-cover]="isVertical" [class.wt-hide]="locked"
               playsinline webkit-playsinline preload="metadata"
               controlsList="nodownload noremoteplayback" disablePictureInPicture
               (click)="onStageTap()"
               (timeupdate)="onTime()" (play)="playing = true" (pause)="playing = false"
               (waiting)="buffering = true" (playing)="buffering = false"
               (loadedmetadata)="onMeta()" (ended)="onEnded()" (error)="onVideoError()"></video>

        <div class="wt-top" [class.wt-fade]="!controlsVisible">
          <button class="wt-back" (click)="back()">&#8592; Orqaga</button>
          <span class="wt-name">{{ content?.title }}</span>
          <button class="wt-heart" *ngIf="content" (click)="toggleFav()">
            <span *ngIf="isFav" class="wt-heart-on">&#9829;</span>
            <span *ngIf="!isFav">&#9825;</span>
          </button>
        </div>

        <div class="wt-wm" *ngIf="showWm && !locked" [class.wt-wm-v]="isVertical">ID: {{ uid }}</div>

        <div class="wt-spin" *ngIf="buffering && !locked && !errorText"><div class="wt-spin-in"></div></div>

        <div class="wt-bigplay" *ngIf="!playing && !buffering && !locked && !errorText" (click)="togglePlay()">
          <div class="wt-bigplay-in">&#9654;</div>
        </div>

        <div class="wt-err" *ngIf="errorText && !locked">
          <p>{{ errorText }}</p>
          <button (click)="retry()">Qayta urinish</button>
        </div>

        <div class="wt-locked" *ngIf="locked">
          <img class="wt-locked-bg" *ngIf="posterOf()" [src]="posterOf()" alt="" />
          <div class="wt-locked-card">
            <div class="wt-lock-ico">&#128274;</div>
            <h3>Ushbu kontent himoyalangan!</h3>
            <p>Korish uchun VIP obuna oling yoki alohida xarid qiling.</p>
            <button class="wt-lock-btn" (click)="goPlans()">Tariflarni korish</button>
          </div>
        </div>

        <div class="wt-ctrl" *ngIf="!locked" [class.wt-fade]="!controlsVisible">
          <input type="range" class="wt-seek" min="0" [max]="duration || 0" step="1"
                 [value]="currentTime" (input)="seekTo($event)" />
          <div class="wt-row">
            <button class="wt-ib" (click)="togglePlay()">
              <span *ngIf="!playing">&#9654;</span>
              <span *ngIf="playing">&#10074;&#10074;</span>
            </button>
            <button class="wt-ib wt-sm" (click)="skip(-10)">-10</button>
            <button class="wt-ib wt-sm" (click)="skip(10)">+10</button>
            <span class="wt-time">{{ fmt(currentTime) }} / {{ fmt(duration) }}</span>
            <div class="wt-q" *ngIf="qualityOptions.length">
              <button class="wt-qb" (click)="qMenu = !qMenu">{{ qualityLabel }}</button>
              <div class="wt-qm" *ngIf="qMenu">
                <button *ngFor="let q of qualityOptions" [class.wt-qon]="q.level === selectedLevel"
                        (click)="setQuality(q.level)">{{ q.label }}</button>
              </div>
            </div>
            <button class="wt-ib" (click)="fullscreen()" title="To'liq ekran">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="wt-body" *ngIf="content">
        <h1 class="wt-title">{{ content.title }}</h1>
        <div class="wt-meta">
          <span *ngIf="content.year">{{ content.year }}</span>
          <span *ngIf="content.rating">&#9733; {{ content.rating }}</span>
          <span class="wt-badge" *ngIf="content.isPremium">PREMIUM</span>
          <span *ngIf="episodes.length">{{ episodes.length }} qism</span>
        </div>
        <p class="wt-desc" *ngIf="content.description">{{ content.description }}</p>

        <div class="wt-actions">
          <button class="wt-fav" (click)="toggleFav()">
            <span *ngIf="isFav">&#9829; Saqlangan</span>
            <span *ngIf="!isFav">&#9825; Saqlash</span>
          </button>
        </div>

        <section *ngIf="episodes.length">
          <h2 class="wt-sec">Qismlar ({{ episodes.length }} ta)</h2>
          <div class="wt-grid">
            <button class="wt-ep" *ngFor="let ep of episodes; let i = index"
                    [class.wt-ep-on]="activeEp && activeEp.id === ep.id"
                    (click)="selectEpisode(ep)">
              <div class="wt-ep-poster">
                <img *ngIf="epPoster(ep)" [src]="epPoster(ep)" alt="" />
                <div class="wt-ep-shade"></div>
                <span class="wt-ep-name">{{ ep.title || ((ep.episodeNumber || (i + 1)) + '-qism') }}</span>
                <div class="wt-ep-badge">
                  <span class="wt-free" *ngIf="ep.isFree">BEPUL</span>
                  <span class="wt-open" *ngIf="!ep.isFree && canWatch(ep)">OCHIQ</span>
                  <span class="wt-lock" *ngIf="!canWatch(ep)">&#128274;</span>
                </div>
                <div class="wt-ep-play" *ngIf="activeEp && activeEp.id === ep.id">&#9654;</div>
              </div>
            </button>
          </div>
        </section>
      </div>

      <div class="wt-loading" *ngIf="!content">Yuklanmoqda...</div>
    </div>
  `,
  styles: [`
    .wt { background: #0f0f0f; min-height: 100dvh; padding-bottom: 100px; }
    .wt-stage { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #000; overflow: hidden; user-select: none; }
    .wt-vert { aspect-ratio: 9 / 16; width: auto; height: 78dvh; max-width: 100%; margin: 0 auto; }
    .wt-video { width: 100%; height: 100%; object-fit: contain; display: block; background: #000; }
    .wt-cover { object-fit: cover; }
    .wt-hide { visibility: hidden; }
    .wt-top {
      position: absolute; top: 0; left: 0; right: 0; z-index: 30;
      display: flex; align-items: center; gap: 8px; padding: 10px 12px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
      transition: opacity 0.3s;
    }
    .wt-fade { opacity: 0; pointer-events: none; }
    .wt-back {
      flex-shrink: 0; padding: 6px 12px; border-radius: 999px; border: none; cursor: pointer;
      background: rgba(0,0,0,0.45); color: #fff; font-size: 11px; font-weight: 800;
      backdrop-filter: blur(6px);
    }
    .wt-name {
      flex: 1; min-width: 0; font-size: 12px; font-weight: 800; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .wt-heart {
      flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer;
      background: rgba(0,0,0,0.45); color: #d4d4d8; font-size: 15px;
    }
    .wt-heart-on { color: #ef4444; }
    .wt-wm {
      position: absolute; z-index: 20; pointer-events: none; user-select: none;
      font-family: monospace; font-size: 10px; font-weight: 700;
      color: rgba(255,255,255,0.32); text-shadow: 0 1px 1px rgba(0,0,0,0.7);
      animation: roamWide 30s ease-in-out infinite;
    }
    .wt-wm-v { animation-name: roamVert; animation-duration: 25s; }
    @keyframes roamWide {
      0% { top: 18%; left: 8%; transform: translate(0, 0); }
      25% { top: 72%; left: 88%; transform: translate(-100%, -100%); }
      50% { top: 18%; left: 88%; transform: translate(-100%, 0); }
      75% { top: 72%; left: 8%; transform: translate(0, -100%); }
      100% { top: 18%; left: 8%; transform: translate(0, 0); }
    }
    @keyframes roamVert {
      0% { top: 12%; left: 8%; transform: translate(0, 0); }
      25% { top: 82%; left: 85%; transform: translate(-100%, -100%); }
      50% { top: 28%; left: 85%; transform: translate(-100%, 0); }
      75% { top: 82%; left: 8%; transform: translate(0, -100%); }
      100% { top: 12%; left: 8%; transform: translate(0, 0); }
    }
    .wt-spin { position: absolute; inset: 0; z-index: 12; display: flex; align-items: center; justify-content: center; pointer-events: none; }
    .wt-spin-in {
      width: 44px; height: 44px; border-radius: 50%;
      border: 4px solid rgba(255,255,255,0.25); border-top-color: #ef4444;
      animation: wtspin 0.8s linear infinite;
    }
    @keyframes wtspin { to { transform: rotate(360deg); } }
    .wt-bigplay {
      position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.3); cursor: pointer;
    }
    .wt-bigplay-in {
      width: 64px; height: 64px; border-radius: 50%; background: rgba(220,38,38,0.92);
      color: #fff; font-size: 26px; display: flex; align-items: center; justify-content: center;
      padding-left: 4px; box-shadow: 0 10px 30px rgba(220,38,38,0.5);
    }
    .wt-err {
      position: absolute; inset: 0; z-index: 25; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 12px; padding: 20px; text-align: center;
      background: rgba(0,0,0,0.85); color: #fff; font-size: 13px;
    }
    .wt-err p { margin: 0; }
    .wt-err button {
      padding: 9px 18px; border-radius: 10px; border: none; cursor: pointer;
      background: #dc2626; color: #fff; font-weight: 800; font-size: 13px;
    }
    .wt-locked { position: absolute; inset: 0; z-index: 26; display: flex; align-items: center; justify-content: center; padding: 16px; background: #09090b; }
    .wt-locked-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.2; filter: blur(8px); }
    .wt-locked-card {
      position: relative; z-index: 1; max-width: 300px; width: 100%; text-align: center;
      padding: 18px; border-radius: 18px; background: rgba(24,24,27,0.95); border: 1px solid #27272a;
    }
    .wt-lock-ico { font-size: 26px; }
    .wt-locked-card h3 { margin: 8px 0 4px; font-size: 15px; font-weight: 900; color: #fff; }
    .wt-locked-card p { margin: 0 0 12px; font-size: 11.5px; color: #a1a1aa; line-height: 1.5; }
    .wt-lock-btn {
      width: 100%; padding: 11px; border-radius: 12px; border: none; cursor: pointer;
      background: #dc2626; color: #fff; font-weight: 800; font-size: 13px;
    }
    .wt-ctrl {
      position: absolute; left: 0; right: 0; bottom: 0; z-index: 30; padding: 18px 12px 8px;
      background: linear-gradient(to top, rgba(0,0,0,0.85), transparent); transition: opacity 0.3s;
    }
    .wt-seek { width: 100%; height: 4px; accent-color: #ef4444; cursor: pointer; margin: 0 0 6px; }
    .wt-row { display: flex; align-items: center; gap: 6px; }
    .wt-ib {
      background: none; border: none; color: #fff; font-size: 16px; cursor: pointer;
      padding: 4px 6px; line-height: 1;
    }
    .wt-sm { font-size: 11px; font-weight: 800; color: #d4d4d8; }
    .wt-time { flex: 1; font-size: 11px; color: #e4e4e7; font-variant-numeric: tabular-nums; }
    .wt-q { position: relative; }
    .wt-qb {
      background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25);
      color: #fff; padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;
    }
    .wt-qm {
      position: absolute; bottom: 100%; right: 0; margin-bottom: 4px; min-width: 84px;
      background: rgba(20,20,20,0.96); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; overflow: hidden;
    }
    .wt-qm button { display: block; width: 100%; background: none; border: none; color: #fff; padding: 8px 14px; text-align: left; font-size: 12px; cursor: pointer; }
    .wt-qm .wt-qon { color: #ef4444; font-weight: 800; }
    .wt-body { padding: 16px 14px 0; }
    .wt-title { margin: 0; font-size: 20px; font-weight: 900; color: #fff; }
    .wt-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 8px; font-size: 12px; color: #a1a1aa; }
    .wt-badge {
      background: linear-gradient(to right, #f59e0b, #d97706); color: #09090b;
      font-size: 9px; font-weight: 900; padding: 2px 7px; border-radius: 4px;
    }
    .wt-desc { margin: 12px 0 0; font-size: 13px; line-height: 1.6; color: #d4d4d8; }
    .wt-actions { margin-top: 14px; }
    .wt-fav {
      padding: 9px 16px; border-radius: 12px; font-size: 13px; font-weight: 800; cursor: pointer;
      background: #18181b; color: #f87171; border: 1px solid #27272a;
    }
    .wt-sec { font-size: 15px; font-weight: 900; color: #fff; margin: 22px 0 10px; }
    .wt-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
    .wt-ep { padding: 0; background: none; border: none; cursor: pointer; text-align: left; }
    .wt-ep-poster {
      position: relative; width: 100%; aspect-ratio: 2 / 3; border-radius: 10px; overflow: hidden;
      background: linear-gradient(135deg, #27272a, #18181b); border: 1px solid #27272a;
    }
    .wt-ep-on .wt-ep-poster { border-color: rgba(239,68,68,0.7); box-shadow: 0 0 15px rgba(239,68,68,0.25); }
    .wt-ep-poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .wt-ep-shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent 55%); }
    .wt-ep-name {
      position: absolute; left: 4px; right: 4px; bottom: 5px; text-align: center;
      font-size: 9px; font-weight: 900; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .wt-ep-badge { position: absolute; top: 5px; right: 5px; }
    .wt-free, .wt-open {
      font-size: 8px; font-weight: 900; padding: 2px 5px; border-radius: 4px;
    }
    .wt-free { color: #34d399; background: rgba(16,185,129,0.3); border: 1px solid rgba(16,185,129,0.4); }
    .wt-open { color: #fbbf24; background: rgba(245,158,11,0.3); border: 1px solid rgba(245,158,11,0.4); }
    .wt-lock {
      display: flex; width: 22px; height: 22px; border-radius: 50%; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.6); font-size: 11px;
    }
    .wt-ep-play {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.25); color: #fff; font-size: 16px; padding-left: 2px;
    }
    .wt-loading { padding: 40px; text-align: center; color: #a1a1aa; font-size: 13px; }
  `],
})
export class WatchComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;

  content: any = null;
  episodes: any[] = [];
  activeEp: any = null;

  locked = false;
  buffering = true;
  playing = false;
  errorText = '';
  isFav = false;

  currentTime = 0;
  duration = 0;
  controlsVisible = true;
  qMenu = false;
  selectedLevel = -1;
  qualityOptions: Array<{ level: number; label: string }> = [];

  uid = '';
  showWm = true;
  private isVip = false;
  private isAdmin = false;

  private hls?: Hls;
  private startAt = 0;
  private hideTimer: any = null;
  private saveTimer: any = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: ApiService,
    private readonly storage: StorageService,
  ) {}

  get isVertical(): boolean {
    return !!(this.content && this.content.type === 'short_drama');
  }

  get qualityLabel(): string {
    if (this.selectedLevel === -1) { return 'Auto'; }
    const f = this.qualityOptions.find((q) => q.level === this.selectedLevel);
    return f ? f.label : 'Auto';
  }

  ngOnInit(): void {
    const u: any = this.storage.getUser();
    if (u) {
      this.uid = String(u.id || u.telegramId || '');
      this.isVip = !!u.isVip;
      this.isAdmin = u.role === 'admin' || u.role === 'super_admin';
      this.showWm = u.role !== 'super_admin' && !!this.uid;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }

    this.api.getContentById(id).subscribe({
      next: (r: any) => {
        this.content = r && r.data ? r.data : r;
        const eps: any[] = (this.content && this.content.episodes) || [];
        this.episodes = eps.slice().sort((a: any, b: any) => {
          const s = (a.seasonNumber || 1) - (b.seasonNumber || 1);
          return s !== 0 ? s : (a.episodeNumber || 0) - (b.episodeNumber || 0);
        });
        this.isFav = !!(this.content && this.content.isFavorite);
        if (this.episodes.length) {
          this.selectEpisode(this.episodes[0]);
        } else {
          this.activeEp = null;
          this.startAt = Number(this.content.watchProgress || 0);
          if (this.canWatch(null)) { this.load(); } else { this.locked = true; }
        }
      },
      error: () => { this.buffering = false; this.errorText = 'Kontent yuklanmadi.'; },
    });

    this.saveTimer = setInterval(() => this.saveProgress(), 10000);
  }

  ngOnDestroy(): void {
    this.saveProgress();
    this.destroyHls();
    if (this.saveTimer) { clearInterval(this.saveTimer); }
    if (this.hideTimer) { clearTimeout(this.hideTimer); }
  }

  /** v1 checkHasAccess mantig'i */
  canWatch(ep: any): boolean {
    if (!this.content) { return false; }
    if (this.isAdmin) { return true; }
    if (ep && ep.isFree) { return true; }
    if (!this.content.isPremium && (!ep || ep.isFree) && !this.content.price) { return true; }
    if (this.content.hasAccess) { return true; }
    if (this.content.isVipIncluded !== false && this.isVip) { return true; }
    if (!this.content.isPremium && !this.content.price && !ep) { return true; }
    return false;
  }

  selectEpisode(ep: any): void {
    if (!ep) { return; }
    this.activeEp = ep;
    this.startAt = Number(ep.watchProgress || 0);
    this.errorText = '';
    if (!this.canWatch(ep)) {
      this.locked = true;
      const v = this.videoRef.nativeElement;
      v.pause();
      this.playing = false;
      this.buffering = false;
      return;
    }
    this.locked = false;
    this.load();
    if (typeof window !== 'undefined') { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  private directUrl(): string {
    const raw = (this.activeEp && this.activeEp.videoUrl) || (this.content && this.content.videoUrl) || '';
    return this.abs(raw);
  }

  private load(): void {
    this.destroyHls();
    this.errorText = '';
    this.buffering = true;
    this.qualityOptions = [];
    this.selectedLevel = -1;
    this.currentTime = 0;
    this.duration = 0;

    const direct = this.directUrl();
    const src: any = this.activeEp || this.content;
    const hlsReady = !!(src && src.hlsPath);

    if (direct && !hlsReady) { this.playDirect(direct); return; }

    const req: any = this.activeEp
      ? this.api.getEpisodeStreamUrl(this.content.id, this.activeEp.id)
      : this.api.getStreamUrl(this.content.id);
    req.subscribe({
      next: (s: any) => {
        if (s && s.masterPlaylist) { this.playHls(s.masterPlaylist, direct); }
        else if (direct) { this.playDirect(direct); }
        else { this.fail('Video manzili topilmadi.'); }
      },
      error: () => {
        if (direct) { this.playDirect(direct); }
        else { this.fail('Video ochilmadi. Obuna yoki kirish huquqini tekshiring.'); }
      },
    });
  }

  private playDirect(url: string): void {
    const v = this.videoRef.nativeElement;
    this.destroyHls();
    v.src = url;
    v.load();
    v.play().catch(() => { this.buffering = false; });
  }

  private playHls(url: string, fallback: string): void {
    const v = this.videoRef.nativeElement;
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, startLevel: -1, maxMaxBufferLength: 60 });
      this.hls = hls;
      hls.loadSource(url);
      hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, (_e: any, data: any) => {
        const mapped = (data.levels || []).map((l: any, i: number) => ({
          level: i,
          label: l.height ? l.height + 'p' : Math.round(l.bitrate / 1000) + 'k',
        }));
        this.qualityOptions = [{ level: -1, label: 'Auto' }].concat(mapped);
        v.play().catch(() => { this.buffering = false; });
      });
      hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
        if (data && data.fatal) {
          if (fallback) { this.playDirect(fallback); }
          else { this.fail('Oqim uzildi. Internetni tekshirib qayta urinib koring.'); }
        }
      });
    } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = url;
      v.play().catch(() => { this.buffering = false; });
    } else if (fallback) {
      this.playDirect(fallback);
    } else {
      this.fail('Brauzeringiz video oqimini qollab-quvvatlamaydi.');
    }
  }

  private destroyHls(): void {
    if (this.hls) { this.hls.destroy(); this.hls = undefined; }
  }

  private fail(msg: string): void {
    this.buffering = false;
    this.playing = false;
    this.errorText = msg;
  }

  retry(): void {
    if (!this.content) { return; }
    if (this.activeEp) { this.selectEpisode(this.activeEp); } else { this.load(); }
  }

  onVideoError(): void {
    const v = this.videoRef.nativeElement;
    if (!v.getAttribute('src') && !this.hls) { return; }
    if (this.hls) { return; }
    this.fail('Video fayl ochilmadi. Keyinroq qayta urinib koring.');
  }

  onMeta(): void {
    const v = this.videoRef.nativeElement;
    this.duration = v.duration || 0;
    this.buffering = false;
    if (this.startAt > 5 && this.duration && this.startAt < this.duration - 5) {
      v.currentTime = this.startAt;
    }
    this.startAt = 0;
  }

  onTime(): void {
    const v = this.videoRef.nativeElement;
    this.currentTime = v.currentTime;
    if (v.duration) { this.duration = v.duration; }
  }

  onEnded(): void {
    this.playing = false;
    this.saveProgress();
    if (!this.activeEp) { return; }
    const idx = this.episodes.findIndex((e) => e.id === this.activeEp.id);
    if (idx >= 0 && idx + 1 < this.episodes.length) {
      this.selectEpisode(this.episodes[idx + 1]);
    }
  }

  onStageTap(): void {
    this.qMenu = false;
    this.controlsVisible = !this.controlsVisible;
    if (this.controlsVisible) { this.armHide(); }
  }

  private armHide(): void {
    if (this.hideTimer) { clearTimeout(this.hideTimer); }
    this.hideTimer = setTimeout(() => {
      if (this.playing) { this.controlsVisible = false; }
    }, 3000);
  }

  togglePlay(): void {
    const v = this.videoRef.nativeElement;
    if (v.paused) { v.play().catch(() => { /* noop */ }); this.armHide(); }
    else { v.pause(); }
  }

  skip(sec: number): void {
    const v = this.videoRef.nativeElement;
    v.currentTime = Math.max(0, Math.min((v.duration || 0), v.currentTime + sec));
  }

  seekTo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.videoRef.nativeElement.currentTime = +input.value;
  }

  setQuality(level: number): void {
    this.selectedLevel = level;
    this.qMenu = false;
    if (this.hls) {
      this.hls.currentLevel = level;
    }
  }

  fullscreen(): void {
    const el = this.videoRef.nativeElement.parentElement as HTMLElement;
    const doc: any = document;
    if (!doc.fullscreenElement) {
      if (el.requestFullscreen) { el.requestFullscreen(); }
    } else if (doc.exitFullscreen) {
      doc.exitFullscreen();
    }
  }

  fmt(sec: number): string {
    if (!sec || isNaN(sec)) { return '0:00'; }
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return m + ':' + s;
  }

  private saveProgress(): void {
    if (!this.content || !this.currentTime || this.locked) { return; }
    this.api.saveProgress(this.content.id, {
      episodeId: this.activeEp ? this.activeEp.id : undefined,
      progressSeconds: Math.floor(this.currentTime),
      durationSeconds: Math.floor(this.duration),
    }).subscribe({ error: () => { /* noop */ } });
  }

  /** Nisbiy fayl manzillarini API origin bilan to'ldirish */
  private abs(u: string): string {
    if (!u) { return ''; }
    if (/^https?:\/\//i.test(u)) { return u; }
    const origin = String(environment.apiUrl || '').replace(/\/api\/v1\/?$/, '');
    return origin + (u.charAt(0) === '/' ? u : '/' + u);
  }

  posterOf(): string {
    return this.content ? this.abs(this.content.posterUrl || '') : '';
  }

  epPoster(ep: any): string {
    return this.abs((ep && ep.thumbnailUrl) || (this.content && this.content.posterUrl) || '');
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
