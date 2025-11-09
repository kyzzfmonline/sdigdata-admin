# Use Debian for building, distroless for production
FROM node:20-bookworm AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install -g npm@latest
RUN npm install  --verbose

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

ENV NEXT_PUBLIC_API_BASE_URL=https://api.sdigdata.com

RUN npm run build

# Use distroless for minimal production image
FROM gcr.io/distroless/nodejs20-debian12 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000

# Distroless runs as non-root by default
CMD ["server.js"]
