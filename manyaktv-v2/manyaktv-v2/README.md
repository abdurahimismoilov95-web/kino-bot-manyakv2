# Manyak TV v2

Telegram Web App asosidagi kino platformasi — to'liq qayta qurilgan arxitektura.

## Texnologiyalar

| Qatlam | Texnologiya |
|--------|-------------|
| Backend API | NestJS v10 + TypeScript |
| Database | PostgreSQL 16 + TypeORM 0.3 |
| Cache / Queue | Redis 7 + BullMQ |
| Bot | grammY (alohida microservice) |
| Video Streaming | Nginx + FFmpeg + HLS.js |
| Frontend | Angular 19 + Tailwind CSS |
| Infra | Docker Compose |

## Tuzilma

```
manyaktv-v2/
├── apps/
│   ├── api/          # NestJS REST API (port 3001)
│   ├── bot/          # Telegram bot microservice
│   └── web/          # Angular 19 frontend
├── infra/
│   ├── nginx/        # nginx.conf + hls.conf
│   ├── docker/       # Dockerfile'lar
│   ├── postgres/     # init.sql
│   └── scripts/      # transcode-hls.sh
└── docker-compose.yml
```

## Ishga tushirish

### 1. .env yaratish
```bash
cp .env.example .env
# .env ni to'ldiring
```

### 2. Docker bilan ishga tushirish
```bash
docker compose up -d
```

### 3. Video transcode qilish (HLS)
```bash
bash infra/scripts/transcode-hls.sh /path/to/video.mp4 <content-uuid>
```

## API Endpoints

- `POST /api/v1/auth/verify` — Telegram initData bilan kirish
- `GET  /api/v1/content`     — Kino ro'yxati
- `GET  /api/v1/streaming/content/:id` — HLS stream URL olish
- `GET  /api/v1/events/stream` — SSE real-time events
- `GET  /api/docs` — Swagger UI (dev mode)

## 8 ta muammo yechimlari

1. **SQLite -> PostgreSQL** — production-grade DB
2. **Git** — versiya boshqaruvi, CHANGELOG
3. **Clean Code + SOLID** — modular NestJS struktura
4. **Microservices** — API, Bot, Jobs alohida processlar
5. **Node.js -> NestJS** — TypeScript, DI, modullar
6. **HLS Streaming** — Nginx + FFmpeg, Range request yo'q
7. **Quality Selector** — Auto/480p/720p/1080p HLS.js
8. **Angular 19** — strict struktura, lazy loading
