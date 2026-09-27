# ─── Stage 1: Build ───────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# API papkasiga o'tish
COPY manyaktv-v2/apps/api/package*.json ./
RUN npm install --legacy-peer-deps

COPY manyaktv-v2/apps/api/ ./
RUN npm run build

# ─── Stage 2: Production ──────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY manyaktv-v2/apps/api/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist

RUN mkdir -p /tmp/uploads /tmp/hls-output

EXPOSE 10000

CMD ["node", "dist/main"]
