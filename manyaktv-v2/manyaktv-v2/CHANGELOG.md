# Changelog - Manyak TV

All notable changes to this project will be documented in this file.
Format: [Semantic Versioning](https://semver.org)

---

## [2.0.0] - 2026-09-26

### ARXITEKTURA TO'LIQ QAYTA QURILDI

#### MUAMMO 1: SQLite -> PostgreSQL
- **Avval:** SQLite (node:sqlite) - production uchun yaroqsiz
- **Endi:** PostgreSQL 16 + TypeORM 0.3
- Connection pool (max: 20), JSONB, pg_trgm, uuid-ossp extensions
- Barcha jadvallar to'liq migratsiya bilan (init.sql)

#### MUAMMO 2: Git versioning
- `.gitignore` to'g'ri sozlandi
- Conventional commits qoidalari joriy etildi
- `CHANGELOG.md` yuritila boshlandi

#### MUAMMO 3: Clean Code + SOLID folder structure
- **Avval:** Tartibsiz, tekis fayl struktura
- **Endi:** `apps/api`, `apps/bot`, `apps/web`, `libs/`, `infra/` 
- NestJS modular struktura (har bir domain o'z modulida)
- SOLID tamoyillari: Single Responsibility, Dependency Injection

#### MUAMMO 4: Microservices ajratish
- **Avval:** Monolitik server.js (3100+ qator)
- **Endi:**
  - `apps/api` - NestJS REST API (port 3001)
  - `apps/bot` - Alohida Telegram bot microservice
  - Redis pub/sub orqali muloqot
  - BullMQ job queue (Redis asosida)
  - Bot token FAQAT bot processida - parallel instance muammosi yo'q

#### MUAMMO 5: Node.js -> NestJS
- **Avval:** Plain Express.js (server.js)
- **Endi:** NestJS v10 (TypeScript, modular, DI, Guards, Pipes)
- Swagger API documentation avtomatik
- Global ValidationPipe, Throttler, CORS, Helmet
- API Versioning (`/api/v1/...`)

#### MUAMMO 6: HTTP Range -> HLS Streaming
- **Avval:** HTTP Range request (server bottleneck)
- **Endi:** Nginx + FFmpeg + HLS
  - `infra/scripts/transcode-hls.sh` - 3 variant (480p/720p/1080p)
  - Nginx HLS delivery (sendfile, zero-copy)
  - Nginx `auth_request` - har bir HLS segment uchun token tekshirish
  - Signed URL (HMAC-SHA256, TTL 1h) - anti-piracy
  - Ko'p foydalanuvchi parallel tomosha qilsa ham nginx ko'tarib turadi

#### MUAMMO 7: Quality Selector to'liq implement qilindi
- **Avval:** Qisman, ishlamagan quality selector
- **Endi:** HLS.js + real quality switching
  - `Auto` - Adaptive Bitrate (ABR) - tarmoqqa qarab avtomatik
  - `480p` - 800kbps (sekin internet uchun)
  - `720p` - 2500kbps (standart HD)
  - `1080p` - 5000kbps (Full HD)
  - `hls.currentLevel = level` orqali real switching

#### MUAMMO 8: React -> Angular 19
- **Avval:** React 19 + Vite (tartibsiz, qoidasiz)
- **Endi:** Angular 19 + Tailwind CSS
  - Lazy loading routing (har bir sahifa alohida chunk)
  - Angular animatsiyalar (Splash screen, transitions)
  - Strict TypeScript (noImplicitAny, strictNullChecks)
  - HWID fingerprint (Web Crypto API)
  - SSE real-time (Redis pub/sub orqali)

### Added
- PostgreSQL + TypeORM entities: User, Content, Episode, Receipt, Plan, PromoCode, WatchHistory, Favorite
- Microservice: `apps/bot` (grammY, Redis listener, NotificationService)
- NestJS modules: Auth, Users, Content, Streaming, Payment, Subscription, Events, Bot, Admin, Upload, Health
- Nginx HLS streaming config (`hls.conf`) with `auth_request`
- FFmpeg transcoding script (`transcode-hls.sh`) - 480p/720p/1080p
- Docker Compose (postgres + redis + api + bot + nginx)
- Angular 19 frontend with HLS.js player
- Quality selector component (Auto/480p/720p/1080p)
- SSE events via Redis pub/sub (replaces in-memory)
- Daily check-in streak system
- Swagger API docs (/api/docs)

---

## [1.0.0] - 2024-09-22 (manyk-tv1)

### Initial Release
- React 19 + Vite frontend
- Express.js backend
- SQLite database
- HTTP Range video streaming
- Telegram WebApp auth
- Admin panel
- Payment receipts
- VIP subscription
