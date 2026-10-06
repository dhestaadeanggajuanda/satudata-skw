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

# Public CKAN host that browser-facing URLs (downloads/images) are re-based onto.
ARG CKAN_PUBLIC_URL
ENV CKAN_PUBLIC_URL=${CKAN_PUBLIC_URL}

# URL halaman Agent Satu Data (iframe widget kanan-bawah). Di-inline ke bundle browser.
ARG NEXT_PUBLIC_AGENT_URL
ENV NEXT_PUBLIC_AGENT_URL=${NEXT_PUBLIC_AGENT_URL}

# Berita Media Center & parameter build lain. NEXT_PUBLIC_* di-inline ke bundle browser.
ARG NEXT_PUBLIC_MEDIACENTER_URL
ENV NEXT_PUBLIC_MEDIACENTER_URL=${NEXT_PUBLIC_MEDIACENTER_URL}
ARG NEXT_PUBLIC_MEDIACENTER_QUERY
ENV NEXT_PUBLIC_MEDIACENTER_QUERY=${NEXT_PUBLIC_MEDIACENTER_QUERY}
ARG SITE_URL
ENV SITE_URL=${SITE_URL}
ARG REVALIDATE_SECONDS
ENV REVALIDATE_SECONDS=${REVALIDATE_SECONDS}

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
