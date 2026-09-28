/**
 * HLS Player Component
 * - HLS.js orqali adaptive bitrate streaming
 * - Auto / 480p / 720p / 1080p sifat tanlash
 * - Watch progress har 10 sekundda saqlanadi
 * - PiP (Picture in Picture)
 * - Anti-piracy: right-click block, watermark
 */
import {
  Component, Input, Output, EventEmitter, OnInit,
  OnDestroy, ViewChild, ElementRef, AfterViewInit,
} from '@angular/core';
import Hls, { Level } from 'hls.js';
import { firstValueFrom, Subject, interval, fromEvent } from 'rxjs';
import { takeUntil, throttleTime } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { ScreenProtectionService } from '../../../core/services/screen-protection.service';

export interface PlayerConfig {
  contentId: string;
  episodeId?: string;
  title: string;
  initialProgress?: number;
}

@Component({
  selector: 'app-hls-player',
  template: `
    <div class="player-container" (contextmenu)="$event.preventDefault()">
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

      <div class="player-spinner" *ngIf="loading">
        <div class="spinner"></div>
      </div>

      <div class="player-err" *ngIf="errorText">
        <p>{{ errorText }}</p>
        <button (click)="close.emit()">Yopish</button>
      </div>

      <div class="player-controls" [class.hidden]="controlsHidden">
        <div class="controls-top">
          <button class="btn-icon" (click)="close.emit()">&#10006;</button>
          <span class="player-title">{{ config?.title }}</span>
        </div>

        <div class="controls-center" (click)="togglePlay()">
          <span class="play-icon" *ngIf="!playing">&#9654;</span>
          <span class="play-icon" *ngIf="playing">&#9646;&#9646;</span>
        </div>

        <div class="controls-bottom">
          <input
            type="range" class="progress-bar"
            [value]="currentTime" [max]="duration" step="1"
            (input)="seekTo($event)"
          />

          <div class="controls-row">
            <span class="time-label">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>

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

            <button class="btn-icon" (click)="togglePip()">&#9884;</button>
            <button class="btn-icon" (click)="toggleFullscreen()">&#11036;</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .player-container {
      position: relative; width: 100%; background: #000;
      aspect-ratio: 16/9; overflow: hidden; user-select: none;
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
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .player-err {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 12px;
      background: rgba(0,0,0,0.85); color: #fff; font-size: 13px; padding: 20px;
      text-align: center;
    }
    .player-err button {
      padding: 8px 18px; border-radius: 8px; border: none;
      background: #e50914; color: #fff; font-weight: 700;
    }
    .player-controls {
      position: absolute; inset: 0;
      background: linear-gradient(transparent 40%, rgba(0,0,0,0.8) 100%);
      transition: opacity 0.3s;
    }
    .player-controls.hidden { opacity: 0; pointer-events: none; }
    .controls-top {
      position: absolute; top: 0; left: 0; right: 0;
      display: flex; align-items: center; gap: 12px; padding: 16px;
    }
    .player-title { color: #fff; font-weight: 600; font-size: 14px; flex: 1; }
    .controls-center {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
    }
    .play-icon { color: #fff; font-size: 48px; opacity: 0.9; }
    .controls-bottom {
      position: absolute; bottom: 0; left: 0; right: 0; padding: 8px 16px 16px;
    }
    .progress-bar {
      width: 100%; height: 4px; appearance: none;
      background: rgba(255,255,255,0.3); border-radius: 2px;
      cursor: pointer; margin-bottom: 8px;
    }
    .controls-row { display: flex; align-items: center; gap: 12px; }
    .time-label { color: #fff; font-size: 12px; flex: 1; }
    .btn-icon {
      background: none; border: none; color: #fff;
      font-size: 18px; cursor: pointer; padding: 4px; line-height: 1;
    }
    .quality-selector { position: relative; }
    .btn-quality {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      color: #fff; padding: 4px 10px; border-radius: 4px;
      font-size: 12px; cursor: pointer; font-weight: 600;
    }
    .quality-menu {
      position: absolute; bottom: 100%; right: 0;
      background: rgba(20,20,20,0.95);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px; overflow: hidden; min-width: 100px;
    }
    .quality-menu button {
      display: block; width: 100%; background: none; border: none;
      color: #fff; padding: 8px 16px; text-align: left;
      font-size: 13px; cursor: pointer;
    }
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
  private hideTimer: any = null;

  loading = true;
  playing = false;
  currentTime = 0;
  duration = 0;
  controlsHidden = false;
  qualityMenuOpen = false;
  errorText = '';

  selectedLevel = -1;
  qualityOptions: Array<{ level: number; label: string }> = [];

  get selectedQualityLabel(): string {
    if (this.selectedLevel === -1) { return 'Auto'; }
    const found = this.qualityOptions.find((q) => q.level === this.selectedLevel);
    return found ? found.label : 'Auto';
  }

  constructor(
    private readonly api: ApiService,
    private readonly screenGuard: ScreenProtectionService,
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initPlayer();
    this.screenGuard.activate(
      this.videoRef.nativeElement,
      this.videoRef.nativeElement.parentElement as HTMLElement,
    );
    fromEvent(document, 'mousemove')
      .pipe(takeUntil(this.destroy$), throttleTime(200))
      .subscribe(() => this.showControlsTemporarily());
    fromEvent(document, 'touchstart')
      .pipe(takeUntil(this.destroy$), throttleTime(200))
      .subscribe(() => this.showControlsTemporarily());
    interval(10000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.saveProgress());
  }

  ngOnDestroy(): void {
    this.screenGuard.deactivate();
    this.saveProgress();
    if (this.hls) { this.hls.destroy(); }
    if (this.hideTimer) { clearTimeout(this.hideTimer); }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initPlayer(): Promise<void> {
    const video = this.videoRef.nativeElement;
    const contentId = this.config.contentId;
    const episodeId = this.config.episodeId;
    const initialProgress = this.config.initialProgress;

    let stream: any = null;
    try {
      stream = episodeId
        ? await firstValueFrom(this.api.getEpisodeStreamUrl(contentId, episodeId))
        : await firstValueFrom(this.api.getStreamUrl(contentId));
    } catch (e) {
      this.loading = false;
      this.errorText = 'Video ochilmadi. Obuna yoki kirish huquqini tekshiring.';
      return;
    }

    if (!stream || !stream.masterPlaylist) {
      this.loading = false;
      this.errorText = 'Video manzili topilmadi.';
      return;
    }

    if (Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        abrEwmaDefaultEstimate: 1000000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
        maxMaxBufferLength: 60,
        startLevel: -1,
      });

      this.hls.loadSource(stream.masterPlaylist);
      this.hls.attachMedia(video);

      this.hls.on(Hls.Events.MANIFEST_PARSED, (_evt: any, data: any) => {
        this.buildQualityOptions(data.levels);
        if (initialProgress && initialProgress > 5) {
          video.currentTime = initialProgress;
        }
        video.play().catch(() => { /* noop */ });
      });

      this.hls.on(Hls.Events.ERROR, (_evt: any, data: any) => {
        if (data && data.fatal) {
          this.loading = false;
          this.errorText = 'Oqim uzildi. Internetni tekshirib qayta urinib koring.';
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream.masterPlaylist;
      if (initialProgress) { video.currentTime = initialProgress; }
      video.play().catch(() => { /* noop */ });
    } else {
      this.loading = false;
      this.errorText = 'Brauzeringiz HLS oqimini qollab-quvvatlamaydi.';
    }
  }

  private buildQualityOptions(levels: Level[]): void {
    const mapped = (levels || []).map((l: any, i: number) => ({
      level: i,
      label: l.height ? l.height + 'p' : Math.round(l.bitrate / 1000) + 'k',
    }));
    this.qualityOptions = [{ level: -1, label: 'Auto' }].concat(mapped);
  }

  setQuality(level: number): void {
    this.selectedLevel = level;
    this.qualityMenuOpen = false;
    if (this.hls) {
      this.hls.currentLevel = level;
      this.hls.loadLevel = level;
      this.hls.nextLevel = level;
    }
  }

  togglePlay(): void {
    const v = this.videoRef.nativeElement;
    if (v.paused) { v.play(); this.playing = true; }
    else { v.pause(); this.playing = false; }
  }

  seekTo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.videoRef.nativeElement.currentTime = +input.value;
  }

  onTimeUpdate(): void {
    const v = this.videoRef.nativeElement;
    this.currentTime = v.currentTime;
    this.duration = v.duration || 0;
    this.playing = !v.paused;
  }

  onMetadataLoaded(): void {
    this.duration = this.videoRef.nativeElement.duration;
    this.loading = false;
  }

  onEnded(): void {
    this.playing = false;
    this.saveProgress();
    this.completed.emit();
  }

  toggleFullscreen(): void {
    const el = this.videoRef.nativeElement.parentElement as HTMLElement;
    if (!document.fullscreenElement) { el.requestFullscreen(); }
    else { document.exitFullscreen(); }
  }

  togglePip(): void {
    const v: any = this.videoRef.nativeElement;
    const doc: any = document;
    if (doc.pictureInPictureElement) { doc.exitPictureInPicture(); }
    else if (v.requestPictureInPicture) { v.requestPictureInPicture(); }
  }

  formatTime(sec: number): string {
    if (!sec || isNaN(sec)) { return '0:00'; }
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return m + ':' + s;
  }

  private showControlsTemporarily(): void {
    this.controlsHidden = false;
    if (this.hideTimer) { clearTimeout(this.hideTimer); }
    this.hideTimer = setTimeout(() => {
      if (this.playing) { this.controlsHidden = true; }
    }, 3000);
  }

  private saveProgress(): void {
    if (!this.config || !this.config.contentId || !this.currentTime) { return; }
    this.api.saveProgress(this.config.contentId, {
      episodeId: this.config.episodeId,
      progressSeconds: Math.floor(this.currentTime),
      durationSeconds: Math.floor(this.duration),
    }).subscribe({ error: () => { /* noop */ } });
  }
}
