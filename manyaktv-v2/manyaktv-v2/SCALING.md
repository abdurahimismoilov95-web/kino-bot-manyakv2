# MANYAK TV v2 — Scaling Guide
## 50K–100K users | 10K–15K VIP subscribers

---

## 📊 Load Analysis natijalari

| Scenario | DAU | Concurrent | Streamers | NestJS RPS | Bandwidth |
|----------|-----|------------|-----------|------------|-----------|
| MIN (50K users, normal) | 12,500 | 1,000 | 80 | 70 | 0.2 Gbps |
| MAX (100K, kechki peak) | 30,000 | 3,600 | 297 | 362 | **0.9 Gbps** |
| SPIKE (bot broadcast) | 40,000 | 8,000 | 840 | 1,410 | **2.9 Gbps** |

---

## 🚨 Topilgan muammolar va yechimlar

### 1. 🔴 KRITIK: HLS auth_request har .ts segmentga NestJS chaqiradi
**Muammo:** 840 concurrent streamer × 0.25 req/s = 210 NestJS req/s FAQAT AUTH uchun.
Peak: 15K VIP × active % = 3,750+ req/s — server qulaydi.

**Yechim:**
```
❌ ESKI: har .ts segment → auth_request → NestJS → DB query
✅ YANGI: Redis cache → 30 soniyada 1 marta DB, qolganlari Redis dan
```
- `hls-auth.cache.ts` — Redis cache service
- `streaming.service.ts` — `verifyStreamToken()` Redis cache bilan
- `hls.prod.conf` — nginx `proxy_cache` m3u8 uchun (30s)

**Natija:** DB load 30x kamaydi, 210 req/s → 7 req/s.

---

### 2. 🔴 KRITIK: Bandwidth (CDN yo‘q)
**Muammo:** 840 concurrent × 3.5 Mbps = 2.94 Gbps. Oddiy VPS — 1 Gbps uplink.

**Yechim: CDN qo‘shish**
```bash
# BunnyCDN (eng arzon, Oʻzbekistonga yaqin PoP) yoki Cloudflare
# .ts fayllar CDN dan beriladi, origin server FAQAT m3u8 + auth
CDN_BASE_URL=https://manyaktv.b-cdn.net/hls
```
- `docker-compose.prod.yml` da `CDN_BASE_URL` env variable
- `.env` da `NGINX_HLS_BASE_URL=https://manyaktv.b-cdn.net/hls`
- CDN origin: sizning serveringiz, edge: 50+ mamlakatda

**Narx:** BunnyCDN — $0.01/GB. 100TB/oy = $1,000. Lekin server qulmaydi.

---

### 3. 🔴 KRITIK: TypeORM DB pool = 10 (default)
**Muammo:** 3,750 req/s da 10 connection bilan queue → 30s timeout → server javob bermaydi.

**Yechim:** `database.config.ts`
```typescript
extra: {
  min: 5,
  max: 50,  // FIX: 10 → 50
  acquireTimeoutMillis: 30000,
}
// 3 replica × 50 = 150 connections (PostgreSQL max: 200)
```

---

### 4. 🟡 XATARLI: NestJS single process
**Muammo:** 1 Node.js process = 1 CPU core. Event loop block bo‘lsa hammasi to‘xtaydi.

**Yechim A (Docker Swarm):** `docker-compose.prod.yml`
```yaml
deploy:
  replicas: 3  # 3 container = 3 mustaqil Node.js process
```

**Yechim B (PM2 cluster):** `ecosystem.config.js`
```javascript
instances: 'max',    // CPU count: 4 core = 4 worker
exec_mode: 'cluster',
```

---

### 5. 🟡 XATARLI: Rate limit (UZ ISP NAT muammo)
**Muammo:** `30r/s per IP`. Oʻzbekistonda ko‘p ISP shared NAT ishlatadi —
1,000 user bir IP dan ko‘rinadi → 30 req/s limit hammani bloklaydi.

**Yechim:** `nginx.prod.conf`
```nginx
limit_req_zone $binary_remote_addr zone=api:20m rate=100r/s;  # 30 → 100
limit_req_zone $binary_remote_addr zone=hls:20m rate=200r/s;  # 100 → 200
```

---

### 6. 🟡 XATARLI: Nginx upstream keepalive = 32
**Muammo:** 3,750 req/s da 32 persistent connection yetmaydi, har so‘rovda TCP handshake.

**Yechim:** `nginx.prod.conf`
```nginx
keepalive 128;  # FIX: 32 → 128
```

---

## 🛠️ Tavsiya etilgan server konfiguratsiyasi

### Minimal (50K users, ~$80-120/oy):
```
┌──────────────────────────────────────────────┐
│  1 × VPS: 4 vCPU, 8GB RAM, 50GB SSD         │
│  + BunnyCDN (HLS uchun)                     │
│  + Hetzner / DigitalOcean                   │
│  = ~$40 VPS + $20 CDN = $60/oy              │
└──────────────────────────────────────────────┘

Dockers: nginx + 3×api + postgres + redis
PM2 cluster ichida (4 Node.js worker)
```

### Production (100K users, ~$200-300/oy):
```
┌──────────────────────────────────────────────┐
│  Load Balancer (Nginx/HAProxy)               │
│      │                                       │
│  3× API nodes (4 vCPU, 8GB each)            │
│  1× PostgreSQL (8 vCPU, 16GB, SSD)          │
│  1× Redis (4 vCPU, 8GB)                     │
│  BunnyCDN (HLS delivery)                    │
│  = ~$250-350/oy                             │
└──────────────────────────────────────────────┘
```

---

## ✅ Deploy qilish (Docker Swarm)

```bash
# 1. Docker Swarm init
docker swarm init

# 2. Image build
docker build -f infra/docker/api.Dockerfile -t manyaktv-api:latest .
docker build -f infra/docker/bot.Dockerfile -t manyaktv-bot:latest .

# 3. Stack deploy (3 NestJS replica)
docker stack deploy -c docker-compose.prod.yml manyaktv

# 4. Stack holati
docker stack services manyaktv
docker service logs manyaktv_api -f

# 5. Scale up (peak paytida)
docker service scale manyaktv_api=5
```

---

## 📊 Monitoring

```bash
# Real-time connections
watch -n1 'ss -s'

# NestJS RPS
docker stats manyaktv_api

# PostgreSQL active connections
psql -c "SELECT count(*) FROM pg_stat_activity WHERE state='active';"

# Redis memory
redis-cli info memory | grep used_memory_human

# Nginx connections
nginx -T | grep worker_connections
cat /proc/net/sockstat
```
