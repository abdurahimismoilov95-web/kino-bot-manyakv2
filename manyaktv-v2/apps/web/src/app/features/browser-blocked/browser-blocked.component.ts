import { Component } from '@angular/core';

@Component({
  selector: 'app-browser-blocked',
  template: `
    <div class="blocked-container">
      <div class="blocked-card">
        <div class="logo"><span class="logo-m">M</span><span class="logo-text">ANYAK TV</span></div>
        <div class="lock-icon">&#128274;</div>
        <h1 class="title">Kirish taqiqlangan</h1>
        <p class="desc">MANYAK TV faqat <strong>Telegram Mini App</strong> orqali ishlaydi. Brauzer orqali kirish mumkin emas.</p>
        <a class="btn-telegram" href="https://t.me/manyaktv_bot/app" target="_blank" rel="noopener noreferrer">
          <span class="tg-icon">&#9992;</span> Telegramda ochish
        </a>
        <p class="hint">Telegram ilovasini yuklab oling va botni oching.</p>
      </div>
    </div>
  `,
  styles: [`
    .blocked-container { min-height:100dvh; display:flex; align-items:center; justify-content:center; background:#0f0f0f; padding:24px; font-family:sans-serif; }
    .blocked-card { background:#1a1a1a; border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:40px 32px; max-width:380px; width:100%; text-align:center; }
    .logo { display:inline-flex; align-items:center; gap:6px; margin-bottom:28px; }
    .logo-m { width:36px; height:36px; background:#e50914; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900; color:#fff; }
    .logo-text { font-size:18px; font-weight:800; color:#fff; }
    .lock-icon { font-size:56px; margin-bottom:16px; }
    .title { font-size:22px; font-weight:800; color:#fff; margin:0 0 12px; }
    .desc { font-size:15px; color:rgba(255,255,255,0.55); line-height:1.6; margin:0 0 28px; }
    .desc strong { color:rgba(255,255,255,0.85); }
    .btn-telegram { display:flex; align-items:center; justify-content:center; gap:10px; background:#0088cc; color:#fff; font-size:16px; font-weight:700; padding:14px 24px; border-radius:12px; text-decoration:none; margin-bottom:16px; }
    .hint { font-size:12px; color:rgba(255,255,255,0.3); margin:0; }
  `],
})
export class BrowserBlockedComponent {}
