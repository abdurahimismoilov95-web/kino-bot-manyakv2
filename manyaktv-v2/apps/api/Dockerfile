# ─────────────────────────────────────────────
#  Stage 1: Build
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Faqat package fayllarni nusxalash (cache uchun)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Manba kodlarni nusxalash va build
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
#  Stage 2: Production
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Faqat production dependency
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Build natijasini nusxalash
COPY --from=builder /app/dist ./dist

# Uploads va HLS papkalar
RUN mkdir -p /tmp/uploads /tmp/hls-output

EXPOSE 10000

CMD ["node", "dist/main"]
