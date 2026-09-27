# =========================================================
#  MANYAK TV v2 - Telegram Bot Microservice Dockerfile
# =========================================================

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY apps/bot/package.json ./apps/bot/
RUN npm ci --workspace=apps/bot --ignore-scripts

COPY apps/bot ./apps/bot
RUN npm run build --workspace=apps/bot

# -- Production Runner -----------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/bot/package.json ./apps/bot/
RUN npm ci --workspace=apps/bot --omit=dev --ignore-scripts

COPY --from=builder /app/apps/bot/dist ./apps/bot/dist

RUN addgroup -g 1001 -S nodejs && adduser -S botuser -u 1001
USER botuser

CMD ["node", "apps/bot/dist/main.js"]
