/**
 * BrowserBlockedComponent
 *
 * Oddiy brauzerda (Telegram Mini App emas) kirishga uringan
 * oddiy foydalanuvchilarga ko'rsatiladigan sahifa.
 */
import { Component } from '@angular/core';

@Component({
  selector: 'app-browser-blocked',
  template: `
    <div class="blocked-container">

      <div class="blocked-card">
        <!-- Logo -->
        <div class="logo">
          <span class="logo-m">M</span>
          <span class="logo-text">ANYAK TV</span>
        </div>

        <!-- Qulf belgisi -->
        <div class="lock-icon">&#128274;</div>

        <h1 class="title">Kirish taqiqlangan</h1>

        <p class="desc">
          MANYAK TV faqat <strong>Telegram Mini App</strong>
          orqali ishlaydi. Brauzer orqali kirish mumkin emas.
        </p>

        <!-- Telegram orqali ochish tugmasi -->
        <a
          class="btn-telegram"
          href="https://t.me/manyaktv_bot/app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="tg-icon">&#9992;</span>
          Telegramda ochish
        </a>

        <p class="hint">
          Telegram ilovasini yuklab oling va botni oching.
        </p>
      </div>

    </div>
  `,
  styles: [`
    .blocked-container {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f0f0f;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .blocked-card {
      background: #1a1a1a;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 40px 32px;
      max-width: 380px;
      width: 100%;
      text-align: center;
    }

    /* Logo */
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 28px;
    }
    .logo-m {
      width: 36px;
      height: 36px;
      background: #e50914;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 900;
      color: #fff;
      line-height: 1;
    }
    .logo-text {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      letter-spacing: 0.5px;
    }

    /* Qulf */
    .lock-icon {
      font-size: 56px;
      margin-bottom: 16px;
      filter: grayscale(0.3);
    }

    .title {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      margin: 0 0 12px;
    }

    .desc {
      font-size: 15px;
      color: rgba(255,255,255,0.55);
      line-height: 1.6;
      margin: 0 0 28px;
    }
    .desc strong { color: rgba(255,255,255,0.85); font-weight: 600; }

    /* Telegram tugmasi */
    .btn-telegram {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: #0088cc;
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      padding: 14px 24px;
      border-radius: 12px;
      text-decoration: none;
      transition: background 0.2s, transform 0.15s;
      margin-bottom: 16px;
    }
    .btn-telegram:hover {
      background: #007ab8;
      transform: translateY(-1px);
    }
    .tg-icon { font-size: 20px; }

    .hint {
      font-size: 12px;
      color: rgba(255,255,255,0.3);
      margin: 0;
    }
  `],
})
export class BrowserBlockedComponent {}
