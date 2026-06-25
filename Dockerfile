# ────────────────────────────────────────────────────────────────
# Stage 1: production dependencies only
# ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ────────────────────────────────────────────────────────────────
# Stage 2: build
#   Full install needed so tsx (devDep) is available for the
#   prebuild hook (tsx scripts/generate-dcat.ts).
# ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG DMS
ENV DMS=${DMS}

RUN npm run build

# ────────────────────────────────────────────────────────────────
# Stage 3: minimal runtime image
# ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone output includes auto-traced server-side node_modules
COPY --from=builder /app/.next/standalone ./

# Static client chunks
COPY --from=builder /app/.next/static ./.next/static

# Public assets (includes catalog.jsonld generated during build)
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
