# Simple optimized Dockerfile for Next.js with standalone output
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=https://api.sdigdata.com
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build the application
RUN pnpm run build

# Production environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
