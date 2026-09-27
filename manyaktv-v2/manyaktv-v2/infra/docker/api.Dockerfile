# =========================================================
#  MANYAK TV v2 - NestJS API Dockerfile
#  Multi-stage build: builder + production runner
# =========================================================

# -- Stage 1: Build -------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Workspace root fayllarini nusxalash
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json ./apps/api/

# Faqat API dependencies o'rnatish
RUN npm ci --workspace=apps/api --ignore-scripts

# Source code nusxalash
COPY apps/api ./apps/api

# TypeScript build
RUN npm run build --workspace=apps/api

# -- Stage 2: Production Runner --------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# ffmpeg o'rnatish (HLS transcode uchun)
RUN apk add --no-cache ffmpeg

# Faqat prod dependencies
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
RUN npm ci --workspace=apps/api --omit=dev --ignore-scripts

# Build artifacts nusxalash
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Uploads va HLS output uchun papkalar
RUN mkdir -p /app/uploads/{posters,banners,receipts,videos} \
             /app/hls-output

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "apps/api/dist/main.js"]
