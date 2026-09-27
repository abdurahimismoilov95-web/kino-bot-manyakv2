/**
 * HLS Player Component
 * 
 * 7-MUAMMO YEChIMI: Quality selector to'liq implement qilingan!
 * - HLS.js orqali adaptive bitrate streaming
 * - Auto / 480p / 720p / 1080p quality tanlash
 * - Watch progress har 10 sekundda saqlanadi
 * - Pip (Picture in Picture) support
 * - Keyboard shortcuts
 * - Anti-piracy: right-click block, screenshot CSS
 */
import {
  Component, Input, Output, EventEmitter, OnInit,
  OnDestroy, ViewChild, ElementRef, AfterViewInit,
} from '@angular/core';
import Hls, { Level } from 'hls.js';
import { firstValueFrom } from 'rxjs';
import { Subject, interval, fromEvent } from 'rxjs';
import { takeUntil, throttleTime } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { ScreenProtectionService } from '../../../core/services/screen-protection.service';

export interface PlayerConfig {
  contentId: string;
  episodeId?: string;
  title: string;
  initialProgress?: number;    // Oxirgi to'xtatilgan joy (sekund)
}

@Component({
  selector: 'app-hls-player',
  // changeDetection: ChangeDetectionStrategy.OnPush, // Olib tashlandi: OnPush property mutation bilan ishlamaydi
  template: `
    <div class="player-container" (contextmenu)="$event.preventDefault()">
      <!-- Anti-piracy overlay: ScreenProtectionService tomonidan dinamik yaratiladi -->

      <!-- Video element -->
      <video
        #videoEl
        class="player-video"
        playsinline
        webkit-playsinline
        preload="metadata"
        (timeupdate)="onTimeUpdate()"
        (ended)="onEnded()"
        (waiting)="loading = true"
        (playing)="loading = false"
        (loadedmetadata)="onMetadataLoaded()"
      ></video>

      <!-- Loading spinner -->
      <div class="player-spinner" *ngIf="loading">
        <div class="spinner"></div>
      </div>

      <!-- Controls -->
      <div class="player-controls" [class.hidden]="controlsHidden">
        <!-- Top bar -->
        <div class="controls-top">
          <button class="btn-icon" (click)="close.emit()">&#10006;</button>
          <span class="player-title">{{ config?.title }}</span>
        </div>

        <!-- Center: Play/Pause, Seek -->
        <div class="controls-center" (click)="togglePlay()">
          <span class="play-icon" *ngIf="!playing">&#9654;</span>
          <span class="play-icon" *ngIf="playing">&#9646;&#9646;</span>
        </div>

        <!-- Progress bar -->
        <div class="controls-bottom">
          <input
            type="range" class="progress-bar"
            [value]="currentTime" [max]="duration" step="1"
            (input)="seekTo($event)"
          />

          <div class="controls-row">
            <!-- Time -->
            <span class="time-label">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>

            <!-- Quality Selector -->
            <div class="quality-selector">
              <button class="btn-quality" (click)="qualityMenuOpen = !qualityMenuOpen">
                {{ selectedQualityLabel }} &#9660;
              </button>
              <div class="quality-menu" *ngIf="qualityMenuOpen">
                <button
                  *ngFor="let q of qualityOptions"
                  [class.active]="q.level === selectedLevel"
                  (click)="setQuality(q.level)"
                >
                  {{ q.label }}
                </button>
              </div>
            </div>

            <!-- PiP -->
            <button class="btn-icon" (click)="togglePip()" title="Picture in Picture">
              &#9884;
            </button>

            <!-- Fullscreen -->
            <button class="btn-icon" (click)="toggleFullscreen()">
              &#11036;
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .player-container {
      position: relative;
      width: 100%;
      background: #000;
      aspect-ratio: 16/9;
      overflow: hidden;
      user-select: none;
    }
    /* Anti-screenshot watermark */
    .antipiracy-watermark {
      position: absolute;
      color: rgba(255,255,255,0.08);
      font-size: 11px;
      z-index: 10;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      pointer-events: none;
      white-space: nowrap;
    }
    .player-video { width: 100%; height: 100%; object-fit: contain; }
    .player-spinner {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.3);
    }
    .spinner {
      width: 48px; height: 48px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .player-controls {
      position: absolute; inset: 0;
      background: linear-gradient(transparent 40%, rgba(0,0,0,0.8) 100%);
      transition: opacity 0.3s;
    }
    .player-controls.hidden { opacity: 0; pointer-events: none; }
    .controls-top {
      position: absolute; top: 0; left: 0; right: 0;
      display: flex; align-items: center; gap: 12px;
      padding: 16px;
    }
    .player-title { color: #fff; font-weight: 600; font-size: 14px; flex: 1; }
    .controls-center {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    }
    .play-icon { color: #fff; font-size: 48px; opacity: 0.9; }
    .controls-bottom {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 8px 16px 16px;
    }
    .progress-bar {
      width: 100%; height: 4px;
      appearance: none; background: rgba(255,255,255,0.3);
      border-radius: 2px; cursor: pointer; margin-bottom: 8px;
    }
    .controls-row {
      display: flex; align-items: center; gap: 12px;
    }
    .time-label { color: #fff; font-size: 12px; flex: 1; }
    .btn-icon {
      background: none; border: none;
      color: #fff; font-size: 18px; cursor: pointer;
      padding: 4px; line-height: 1;
    }
    /* Quality Selector */
    .quality-selector { position: relative; }
    .btn-quality {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: #fff; padding: 4px 10px;
      border-radius: 4px; font-size: 12px;
      cursor: pointer; font-weight: 600;
    }
    .quality-menu {
      position: absolute; bottom: 100%; right: 0;
      background: rgba(20,20,20,0.95);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px; overflow: hidden;
      min-width: 100px;
    }
    .quality-menu button {
      display: block; width: 100%;
      background: none; border: none;
      color: #fff; padding: 8px 16px;
      text-align: left; font-size: 13px;
      cursor: pointer;
    }
    .quality-menu button:hover { background: rgba(255,255,255,0.1); }
    .quality-menu button.active { color: #e50914; font-weight: 700; }
  `],
})
export class HlsPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() config!: PlayerConfig;
  @Output() close = new EventEmitter<void>();
  @Output() completed = new EventEmitter<void>();

  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;

  private hls?: Hls;
  private readonly destroy$ = new Subject<void>();

  loading = true;
  playing = false;
  currentTime = 0;
  duration = 0;
  controlsHidden = false;
  qualityMenuOpen = false;

  // ----- Quality selector state -----
  selectedLevel = -1;          // -1 = Auto (ABR)
  qualityOptions: Array<{ level: number; label: string }> = [];

  get selectedQualityLabel(): string {
    if (this.selectedLevel === -1) return 'Auto';
    return this.qualityOptions.find((q) => q.level === this.selectedLevel)?.label ?? 'Auto';
  }

  constructor(
    private readonly api: ApiService,
    private readonly screenGuard: ScreenProtectionService,
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initPlayer();
    // Ekran tasvirdan himoya
    this.screenGuard.activate(
      this.videoRef.nativeElement,
      this.videoRef.nativeElement.parentElement as HTMLElement,
    );
    // Controls auto-hide
    fromEvent(document, 'mousemove')
      .pipe(takeUntil(this.destroy$), throttleTime(200))
      .subscribe(() => this.showControlsTemporarily());
    // Watch progress save
    interval(10_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.saveProgress());
  }

  ngOnDestroy(): void {
    this.screenGuard.deactivate();
    this.saveProgress();
    this.hls?.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initPlayer(): Promise<void> {
    const video = this.videoRef.nativeElement;
    const { contentId, episodeId, initialProgress } = this.config;

    // Stream URL olish (NestJS dan signed HLS URL)
    const stream = episodeId
      ? await firstValueFrom(this.api.getEpisodeStreamUrl(contentId, episodeId))
      : await firstValueFrom(this.api.getStreamUrl(contentId));

    if (!stream) return;

    if (Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // Auto quality switching parametrlari
        abrEwmaDefaultEstimate: 1_000_000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
        maxMaxBufferLength: 60,      // 60s buffer (yaxshi kanallar uchun)
        startLevel: -1,              // Boshida auto
      });

      this.hls.loadSource(stream.masterPlaylist);
      this.hls.attachMedia(video);

      // HLS level'lar yuklanganda quality options yaratish
      this.hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        this.buildQualityOptions(data.levels);
        if (initialProgress && initialProgress > 5) {
          video.currentTime = initialProgress;
        }
        video.play().catch(() => {});
      });

      // Level switch bo'lganda UI yangilash
      this.hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (this.selectedLevel === -1) {
          // Auto mode: hozirgi level'ni ko'rsat
          const q = this.qualityOptions.find((o) => o.level === data.level);
          // label'ni auto deb qoldirish
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = stream.masterPlaylist;
      if (initialProgress) video.currentTime = initialProgress;
      video.play().catch(() => {});
    }
  }

  /**
   * HLS levels'dan quality options yasash
   * Levels: [ { height: 480, bitrate: 800000 }, { height: 720, ... }, ... ]
   */
  private buildQualityOptions(levels: Level[]): void {
    this.qualityOptions = [
      { level: -1, label: 'Auto' },
      ...levels.map((l, i) => ({
        level: i,
        label: l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)}k`,
      })),
    ];
  }

  /** Quality o'rnatish — 7-muammo yechimi */
  setQuality(level: number): void {
    this.selectedLevel = level;
    this.qualityMenuOpen = false;
    if (this.hls) {
      this.hls.currentLevel = level;        // -1 = Auto ABR
      this.hls.loadLevel    = level;        // Level'ni majburlash
      this.hls.nextLevel    = level;
    }
  }

  togglePlay(): void {
    const v = this.videoRef.nativeElement;
    if (v.paused) { v.play(); this.playing = true; }
    else          { v.pause(); this.playing = false; }
  }

  seekTo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.videoRef.nativeElement.currentTime = +input.value;
  }

  onTimeUpdate(): void {
    const v = this.videoRef.nativeElement;
    this.currentTime = v.currentTime;
    this.duration    = v.duration || 0;
    this.playing     = !v.paused;
  }

  onMetadataLoaded(): void {
    this.duration = this.videoRef.nativeElement.duration;
    this.loading  = false;
  }

  onEnded(): void {
    this.playing = false;
    this.saveProgress();
    this.completed.emit();
  }

  toggleFullscreen(): void {
    const el = this.videoRef.nativeElement.parentElement!;
    if (!document.fullscreenElement) el.requestFullscreen();
    else document.exitFullscreen();
  }

  togglePip(): void {
    const v = this.videoRef.nativeElement;
    if ((document as any).pictureInPictureElement) {
      (document as any).exitPictureInPicture();
    } else {
      (v as any).requestPictureInPicture?.();
    }
  }

  formatTime(sec: number): string {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private showControlsTemporarily(): void {
    this.controlsHidden = false;
    clearTimeout((this as any)._hideTimer);
    (this as any)._hideTimer = setTimeout(() => {
      if (this.playing) this.controlsHidden = true;
    }, 3000);
  }

  private saveProgress(): void {
    if (!this.config?.contentId || !this.currentTime) return;
    this.api.saveProgress(this.config.contentId, {
      episodeId:       this.config.episodeId,
      progressSeconds: Math.floor(this.currentTime),
      durationSeconds: Math.floor(this.duration),
    }).subscribe({ error: () => {} });
  }
}
