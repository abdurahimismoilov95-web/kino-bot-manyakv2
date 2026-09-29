import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Hls from 'hls.js';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';
import { environment } from '../../../environments/environment';

/** manyak-tv1 VideoPlayerModal.tsx: to'liq ekranli pleyer, ichida qismlar drawer, sifat menyusi, v1 ikonkalari */
@Component({
  selector: 'app-watch',
  template: `
    <div class="pl" (mousemove)="wake()" (touchstart)="tStart($event)" (touchend)="tEnd($event)" (click)="qMenu = false">
      <div class="pl-box" [class.pl-v]="isVertical" (contextmenu)="$event.preventDefault()">

        <video #videoEl class="pl-video" [class.pl-cover]="isVertical" [class.pl-hide]="locked"
               playsinline webkit-playsinline preload="metadata"
               controlsList="nodownload noremoteplayback" disablePictureInPicture
               (click)="onStageTap($event)"
               (timeupdate)="onTime()" (play)="playing = true" (pause)="playing = false"
               (waiting)="buffering = true" (playing)="buffering = false"
               (loadedmetadata)="onMeta()" (ended)="onEnded()" (error)="onVideoError()"></video>

        <div class="pl-top" [class.pl-fade]="!controlsVisible">
          <button class="pl-back" (click)="back(); $event.stopPropagation()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            <span>Orqaga</span>
          </button>
          <span class="pl-name">{{ content?.title }}</span>
          <button class="pl-heart" *ngIf="content" (click)="toggleFav(); $event.stopPropagation()">
            <svg width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 [attr.fill]="isFav ? '#ef4444' : 'none'" [attr.stroke]="isFav ? '#ef4444' : '#d4d4d8'">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>

        <div class="pl-wm" *ngIf="showWm && !locked" [class.pl-wm-v]="isVertical">ID: {{ uid }}</div>

        <div class="pl-notice" *ngIf="notice">
          <div class="pl-notice-ico">
            <div class="pl-notice-ring"></div>
            <svg *ngIf="noticeDir < 0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            <svg *ngIf="noticeDir >= 0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          </div>
          <span class="pl-notice-txt">{{ notice }}</span>
        </div>

        <div class="pl-spin" *ngIf="buffering && !locked && !errorText"><div class="pl-spin-in"></div></div>

        <div class="pl-bigplay" *ngIf="!playing && !buffering && !locked && !errorText" (click)="togglePlay(); $event.stopPropagation()">
          <div class="pl-bigplay-in">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>

        <div class="pl-side" *ngIf="isVertical && episodes.length > 1 && !locked" [class.pl-dim]="!controlsVisible">
          <button class="pl-sb" [disabled]="curIdx <= 0" (click)="goPrev(); $event.stopPropagation()" title="Oldingi qism">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button class="pl-sb pl-sb-red" [disabled]="curIdx >= episodes.length - 1" (click)="goNext(); $event.stopPropagation()" title="Keyingi qism">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        <div class="pl-err" *ngIf="errorText && !locked">
          <p>{{ errorText }}</p>
          <button (click)="retry(); $event.stopPropagation()">Qayta urinish</button>
        </div>

        <div class="pl-locked" *ngIf="locked">
          <img class="pl-locked-bg" *ngIf="posterOf()" [src]="posterOf()" alt="" />
          <div class="pl-locked-card">
            <div class="pl-lock-ico">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3>Ushbu kontent himoyalangan!</h3>
            <p>Korish uchun VIP obuna oling yoki alohida xarid qiling.</p>
            <button class="pl-lock-btn" (click)="goPlans(); $event.stopPropagation()">Tariflarni korish</button>
          </div>
        </div>

        <div class="pl-ctrl" *ngIf="!locked" [class.pl-fade]="!controlsVisible" (click)="$event.stopPropagation()">
          <div class="pl-seekrow">
            <span class="pl-t">{{ fmt(currentTime) }}</span>
            <input type="range" class="pl-seek" min="0" [max]="duration || 0" step="1" [value]="currentTime" (input)="seekTo($event)" />
            <span class="pl-t">{{ fmt(duration) }}</span>
          </div>
          <div class="pl-row">
            <div class="pl-left">
              <button class="pl-ib" (click)="skip(-10)" title="10 soniya orqaga">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </button>
              <button class="pl-pp" (click)="togglePlay()">
                <svg *ngIf="playing" width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                <svg *ngIf="!playing" width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
              <button class="pl-ib" (click)="skip(10)" title="10 soniya oldinga">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
              </button>
              <button class="pl-ib" (click)="toggleMute()">
                <svg *ngIf="!isMuted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                <svg *ngIf="isMuted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              </button>
            </div>

            <div class="pl-right">
              <div class="pl-q">
                <button class="pl-chip" (click)="qMenu = !qMenu; $event.stopPropagation()">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  <span>{{ selectedQ === 'Auto' ? ('Auto (' + autoQ + ')') : selectedQ }}</span>
                </button>
                <div class="pl-qm" *ngIf="qMenu">
                  <button *ngFor="let q of qualities" [class.pl-qon]="selectedQ === q" (click)="setQuality(q); $event.stopPropagation()">{{ q }}</button>
                </div>
              </div>

              <button class="pl-chip" *ngIf="episodes.length" (click)="sheet = true; $event.stopPropagation()" title="Qismlarni ochish">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                <span>{{ (activeEp && activeEp.episodeNumber) || (curIdx + 1) }}/{{ episodes.length }}</span>
              </button>

              <span class="pl-qual" *ngIf="content && content.quality">{{ content.quality }}</span>

              <button class="pl-ib" (click)="fullscreen()" title="To'liq ekran">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="pl-sheet-wrap" *ngIf="sheet && episodes.length" (click)="$event.stopPropagation()">
        <div class="pl-sheet-space" (click)="sheet = false"></div>
        <div class="pl-sheet">
          <img class="pl-sheet-bg" *ngIf="posterOf()" [src]="posterOf()" alt="" />
          <div class="pl-sheet-grad"></div>
          <div class="pl-sheet-in">
            <div class="pl-handle" (click)="sheet = false"></div>
            <div class="pl-sheet-head">
              <div class="pl-sheet-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                <span>Qismlar royxati ({{ episodes.length }} ta)</span>
              </div>
              <button class="pl-x" (click)="sheet = false" title="Yopish">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="pl-sheet-scroll">
              <div class="pl-grid">
                <button class="pl-ep" *ngFor="let ep of episodes; let i = index"
                        [class.pl-ep-on]="activeEp && activeEp.id === ep.id"
                        (click)="pick(ep)">
                  <div class="pl-ep-poster">
                    <img *ngIf="epPoster(ep)" [src]="epPoster(ep)" alt="" />
                    <div class="pl-ep-shade"></div>
                    <span class="pl-ep-name">{{ ep.title || ((ep.episodeNumber || (i + 1)) + '-qism') }}</span>
                    <div class="pl-ep-badge">
                      <span class="pl-free" *ngIf="ep.isFree">BEPUL</span>
                      <span class="pl-open" *ngIf="!ep.isFree && canWatch(ep)">OCHIQ</span>
                      <span class="pl-lock" *ngIf="!canWatch(ep)">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d4d4d8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </span>
                    </div>
                    <div class="pl-ep-play" *ngIf="activeEp && activeEp.id === ep.id">
                      <div class="pl-ep-play-in">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="pl-loading" *ngIf="!content && !errorText">Yuklanmoqda...</div>
    </div>
  `,
  styles: [`
    .pl { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.96); display: flex; align-items: center; justify-content: center; overflow: hidden; user-select: none; -webkit-user-select: none; }
    .pl-box { position: relative; width: 100%; height: 100%; background: #000; overflow: hidden; }
    @media (min-width: 640px) {
      .pl-box { max-width: 1152px; height: auto; aspect-ratio: 16 / 9; border-radius: 16px; border: 1px solid #27272a; box-shadow: 0 25px 60px rgba(0,0,0,0.6); }
      .pl-v { max-width: 420px; height: 94vh; aspect-ratio: 9 / 16; border-radius: 24px; }
    }
    .pl-video { width: 100%; height: 100%; object-fit: contain; display: block; background: #000; cursor: pointer; }
    .pl-cover { object-fit: cover; }
    .pl-hide { visibility: hidden; }
    .pl-top {
      position: absolute; top: 0; left: 0; right: 0; z-index: 30;
      display: flex; align-items: center; gap: 8px; padding: 12px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent);
      transition: opacity 0.3s;
    }
    .pl-fade { opacity: 0; pointer-events: none; }
    .pl-back {
      flex-shrink: 0; display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; border: none; cursor: pointer;
      background: rgba(0,0,0,0.4); color: #fff; font-size: 11px; font-weight: 800; backdrop-filter: blur(6px);
    }
    .pl-name { flex: 1; min-width: 0; font-size: 12px; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 3px rgba(0,0,0,0.7); }
    .pl-heart { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; }
    .pl-wm {
      position: absolute; z-index: 20; pointer-events: none; user-select: none;
      font-family: monospace; font-size: 11px; font-weight: 700;
      color: rgba(255,255,255,0.3); text-shadow: 0 1px 1px rgba(0,0,0,0.7);
      animation: roamWide 30s ease-in-out infinite;
    }
    .pl-wm-v { animation-name: roamVert; animation-duration: 25s; }
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
    .pl-notice { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 35; pointer-events: none; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .pl-notice-ico { position: relative; width: 56px; height: 56px; border-radius: 50%; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(220,38,38,0.3); }
    .pl-notice-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid transparent; border-top-color: #ef4444; border-left-color: #ef4444; animation: plspin 0.8s linear infinite; }
    .pl-notice-txt { background: rgba(0,0,0,0.6); padding: 6px 16px; border-radius: 999px; color: #fff; font-size: 12px; font-weight: 800; border: 1px solid rgba(255,255,255,0.1); }
    .pl-spin { position: absolute; inset: 0; z-index: 12; display: flex; align-items: center; justify-content: center; pointer-events: none; }
    .pl-spin-in { width: 44px; height: 44px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.25); border-top-color: #ef4444; animation: plspin 0.8s linear infinite; }
    @keyframes plspin { to { transform: rotate(360deg); } }
    .pl-bigplay { position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.35); cursor: pointer; }
    .pl-bigplay-in { width: 68px; height: 68px; border-radius: 50%; background: rgba(220,38,38,0.92); display: flex; align-items: center; justify-content: center; padding-left: 4px; box-shadow: 0 10px 30px rgba(220,38,38,0.5); }
    .pl-side { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); z-index: 20; display: flex; flex-direction: column; gap: 10px; transition: opacity 0.3s; }
    .pl-dim { opacity: 0.3; }
    .pl-sb { padding: 10px; border-radius: 50%; border: 1px solid rgba(63,63,70,0.6); background: rgba(0,0,0,0.8); cursor: pointer; display: flex; }
    .pl-sb-red { background: #dc2626; border-color: #dc2626; box-shadow: 0 6px 18px rgba(220,38,38,0.4); }
    .pl-sb:disabled { opacity: 0.2; cursor: default; }
    .pl-err { position: absolute; inset: 0; z-index: 25; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; text-align: center; background: rgba(0,0,0,0.85); color: #fff; font-size: 13px; }
    .pl-err p { margin: 0; }
    .pl-err button { padding: 9px 18px; border-radius: 10px; border: none; cursor: pointer; background: #dc2626; color: #fff; font-weight: 800; font-size: 13px; }
    .pl-locked { position: absolute; inset: 0; z-index: 26; display: flex; align-items: center; justify-content: center; padding: 16px; background: #09090b; }
    .pl-locked-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.2; filter: blur(8px); }
    .pl-locked-card { position: relative; z-index: 1; max-width: 320px; width: 100%; text-align: center; padding: 22px; border-radius: 18px; background: rgba(24,24,27,0.95); border: 1px solid #27272a; }
    .pl-lock-ico { width: 48px; height: 48px; margin: 0 auto 10px; border-radius: 16px; background: rgba(69,10,10,0.8); border: 1px solid #991b1b; display: flex; align-items: center; justify-content: center; }
    .pl-locked-card h3 { margin: 0 0 4px; font-size: 17px; font-weight: 900; color: #fff; }
    .pl-locked-card p { margin: 0 0 14px; font-size: 12px; color: #a1a1aa; line-height: 1.5; }
    .pl-lock-btn { width: 100%; padding: 11px; border-radius: 12px; border: none; cursor: pointer; background: #dc2626; color: #fff; font-weight: 800; font-size: 13px; }
    .pl-ctrl { position: absolute; left: 0; right: 0; bottom: 0; z-index: 30; padding: 12px; background: linear-gradient(to top, #000, rgba(0,0,0,0.8), transparent); transition: opacity 0.3s; }
    .pl-seekrow { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .pl-t { font-size: 10px; font-family: monospace; color: #d4d4d8; }
    .pl-seek { flex: 1; height: 3px; accent-color: #dc2626; cursor: pointer; }
    .pl-row { display: flex; align-items: center; justify-content: space-between; }
    .pl-left, .pl-right { display: flex; align-items: center; gap: 6px; }
    .pl-ib { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 50%; display: flex; }
    .pl-ib:hover { background: rgba(255,255,255,0.1); }
    .pl-pp { width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer; background: rgba(220,38,38,0.9); display: flex; align-items: center; justify-content: center; }
    .pl-q { position: relative; }
    .pl-chip { display: flex; align-items: center; gap: 4px; padding: 4px 6px; border-radius: 4px; border: none; cursor: pointer; background: none; color: #d4d4d8; font-size: 10px; font-weight: 800; }
    .pl-chip:hover { background: rgba(255,255,255,0.1); }
    .pl-qm { position: absolute; bottom: 100%; right: 0; margin-bottom: 8px; width: 112px; background: rgba(24,24,27,0.96); border: 1px solid #27272a; border-radius: 8px; overflow: hidden; z-index: 50; display: flex; flex-direction: column; }
    .pl-qm button { text-align: left; padding: 8px 12px; border: none; background: none; color: #d4d4d8; font-size: 11px; font-weight: 800; cursor: pointer; }
    .pl-qm .pl-qon { color: #f87171; background: rgba(248,113,113,0.1); }
    .pl-qual { font-size: 9px; font-weight: 800; color: #d4d4d8; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; }
    .pl-sheet-wrap { position: fixed; inset: 0; z-index: 1100; display: flex; flex-direction: column; justify-content: flex-end; background: rgba(0,0,0,0.4); }
    .pl-sheet-space { flex: 1; width: 100%; }
    .pl-sheet { position: relative; width: 100%; max-width: 480px; margin: 0 auto; height: 40%; min-height: 260px; background: #09090b; border-top: 1px solid rgba(63,63,70,0.8); border-radius: 24px 24px 0 0; padding: 14px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 -10px 40px rgba(0,0,0,0.6); }
    .pl-sheet-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.2; filter: blur(16px); transform: scale(1.1); pointer-events: none; }
    .pl-sheet-grad { position: absolute; inset: 0; background: linear-gradient(to top, #09090b, rgba(9,9,11,0.8), rgba(9,9,11,0.4)); pointer-events: none; }
    .pl-sheet-in { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }
    .pl-handle { width: 48px; height: 6px; background: #3f3f46; border-radius: 999px; margin: 0 auto 10px; flex-shrink: 0; cursor: pointer; }
    .pl-sheet-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid rgba(39,39,42,0.8); flex-shrink: 0; }
    .pl-sheet-title { display: flex; align-items: center; gap: 8px; color: #fff; font-weight: 900; font-size: 13px; }
    .pl-x { padding: 6px; border-radius: 50%; border: none; cursor: pointer; background: rgba(255,255,255,0.05); display: flex; }
    .pl-sheet-scroll { flex: 1; overflow-y: auto; padding-right: 4px; }
    .pl-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
    .pl-ep { padding: 0; background: none; border: none; cursor: pointer; text-align: left; }
    .pl-ep-poster { position: relative; width: 100%; aspect-ratio: 2 / 3; border-radius: 8px; overflow: hidden; background: linear-gradient(135deg, #27272a, #18181b); border: 1px solid #27272a; }
    .pl-ep-on .pl-ep-poster { border-color: rgba(239,68,68,0.6); box-shadow: 0 0 15px rgba(239,68,68,0.25); }
    .pl-ep-poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .pl-ep-shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.65), transparent 55%); }
    .pl-ep-name { position: absolute; left: 4px; right: 4px; bottom: 5px; text-align: center; font-size: 9px; font-weight: 900; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pl-ep-badge { position: absolute; top: 5px; right: 5px; }
    .pl-free, .pl-open { font-size: 8px; font-weight: 900; padding: 2px 5px; border-radius: 4px; }
    .pl-free { color: #34d399; background: rgba(16,185,129,0.3); border: 1px solid rgba(16,185,129,0.4); }
    .pl-open { color: #fbbf24; background: rgba(245,158,11,0.3); border: 1px solid rgba(245,158,11,0.4); }
    .pl-lock { display: flex; width: 24px; height: 24px; border-radius: 50%; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); }
    .pl-ep-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); }
    .pl-ep-play-in { width: 44px; height: 44px; border-radius: 50%; background: rgba(220,38,38,0.95); display: flex; align-items: center; justify-content: center; padding-left: 2px; box-shadow: 0 8px 24px rgba(220,38,38,0.5); }
    .pl-loading { position: absolute; color: #a1a1aa; font-size: 13px; }
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
  isMuted = false;

  currentTime = 0;
  duration = 0;
  controlsVisible = true;
  qMenu = false;
  sheet = false;
  qualities: string[] = ['Auto', '1080p', '720p', '480p'];
  selectedQ = 'Auto';
  autoQ = '720p';

  notice = '';
  noticeDir = 1;

  uid = '';
  showWm = true;
  private isVip = false;
  private isAdmin = false;

  private hls?: Hls;
  private startAt = 0;
  private hideTimer: any = null;
  private saveTimer: any = null;
  private noticeTimer: any = null;
  private tx = 0;
  private ty = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: ApiService,
    private readonly storage: StorageService,
  ) {}

  get isVertical(): boolean {
    return !!(this.content && this.content.type === 'short_drama');
  }

  get curIdx(): number {
    if (!this.activeEp) { return -1; }
    return this.episodes.findIndex((e) => e.id === this.activeEp.id);
  }

  ngOnInit(): void {
    if (typeof document !== 'undefined') { document.body.style.overflow = 'hidden'; }
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
          if (this.canWatch(null)) { this.load(); } else { this.locked = true; this.buffering = false; }
        }
      },
      error: () => { this.buffering = false; this.errorText = 'Kontent yuklanmadi.'; },
    });

    this.saveTimer = setInterval(() => this.saveProgress(), 10000);
  }

  ngOnDestroy(): void {
    this.saveProgress();
    this.destroyHls();
    if (typeof document !== 'undefined') { document.body.style.overflow = ''; }
    if (this.saveTimer) { clearInterval(this.saveTimer); }
    if (this.hideTimer) { clearTimeout(this.hideTimer); }
    if (this.noticeTimer) { clearTimeout(this.noticeTimer); }
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

  pick(ep: any): void {
    this.sheet = false;
    this.selectEpisode(ep);
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
  }

  goNext(hint?: string): void {
    const i = this.curIdx;
    if (i >= 0 && i + 1 < this.episodes.length) {
      const n = this.episodes[i + 1];
      this.showNotice(hint || ('Keyingi ' + (n.episodeNumber || (i + 2)) + '-qism'), 1);
      this.selectEpisode(n);
    }
  }

  goPrev(): void {
    const i = this.curIdx;
    if (i > 0) {
      const p = this.episodes[i - 1];
      this.showNotice('Oldingi ' + (p.episodeNumber || i) + '-qism', -1);
      this.selectEpisode(p);
    }
  }

  private showNotice(msg: string, dir: number): void {
    this.notice = msg;
    this.noticeDir = dir;
    if (this.noticeTimer) { clearTimeout(this.noticeTimer); }
    this.noticeTimer = setTimeout(() => { this.notice = ''; }, 1600);
  }

  tStart(e: TouchEvent): void {
    const t = e.touches[0];
    if (t) { this.tx = t.clientX; this.ty = t.clientY; }
    this.wake();
  }

  tEnd(e: TouchEvent): void {
    if (!this.isVertical || this.sheet || this.locked) { return; }
    const t = e.changedTouches[0];
    if (!t) { return; }
    const dy = this.ty - t.clientY;
    const dx = Math.abs(this.tx - t.clientX);
    if (Math.abs(dy) > 70 && dx < 50) {
      if (dy > 0) { this.goNext(); } else { this.goPrev(); }
    }
  }

  private directUrl(): string {
    const raw = (this.activeEp && this.activeEp.videoUrl) || (this.content && this.content.videoUrl) || '';
    return this.abs(raw);
  }

  private load(): void {
    this.destroyHls();
    this.errorText = '';
    this.buffering = true;
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
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.applyQuality();
        v.play().catch(() => { this.buffering = false; });
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e: any, data: any) => {
        const l: any = hls.levels[data.level];
        if (l && l.height) { this.autoQ = l.height + 'p'; }
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
    const i = this.curIdx;
    if (i >= 0 && i + 1 < this.episodes.length) {
      this.goNext('Avtomatik keyingi qism boshlandi');
    }
  }

  onStageTap(e: Event): void {
    e.stopPropagation();
    this.qMenu = false;
    this.togglePlay();
    this.wake();
  }

  wake(): void {
    this.controlsVisible = true;
    if (this.hideTimer) { clearTimeout(this.hideTimer); }
    this.hideTimer = setTimeout(() => {
      if (this.playing && !this.qMenu) { this.controlsVisible = false; }
    }, 3000);
  }

  togglePlay(): void {
    const v = this.videoRef.nativeElement;
    if (v.paused) { v.play().catch(() => { /* noop */ }); this.wake(); }
    else { v.pause(); }
  }

  toggleMute(): void {
    const v = this.videoRef.nativeElement;
    v.muted = !v.muted;
    this.isMuted = v.muted;
  }

  skip(sec: number): void {
    const v = this.videoRef.nativeElement;
    v.currentTime = Math.max(0, Math.min((v.duration || 0), v.currentTime + sec));
    this.wake();
  }

  seekTo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.videoRef.nativeElement.currentTime = +input.value;
  }

  setQuality(q: string): void {
    this.selectedQ = q;
    this.qMenu = false;
    this.applyQuality();
  }

  private applyQuality(): void {
    if (!this.hls) { return; }
    if (this.selectedQ === 'Auto') { this.hls.currentLevel = -1; return; }
    const target = parseInt(this.selectedQ, 10);
    const levels: any[] = this.hls.levels || [];
    let best = -1;
    let diff = 99999;
    for (let i = 0; i < levels.length; i++) {
      const h = levels[i].height || 0;
      const d = Math.abs(h - target);
      if (d < diff) { diff = d; best = i; }
    }
    if (best >= 0) { this.hls.currentLevel = best; }
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
