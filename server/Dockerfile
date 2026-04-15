# Stage 1: Build
FROM node:20-alpine AS builder

# Check updates and install
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

WORKDIR /app

# Copy root configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all code
COPY packages ./packages
COPY services ./services

# Install Dependencies
RUN pnpm install --frozen-lockfile

# Build everything sequentially to prevent OOM
RUN pnpm turbo run build --concurrency=1

# Stage 2: Runtime
FROM node:20-alpine

RUN npm install -g pnpm pm2

WORKDIR /app

# Copy built code
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services ./services
COPY --from=builder /app/node_modules ./node_modules

# Add the PM2 Ecosystem file
COPY ecosystem.config.js ./

# Expose API Gateway port (All services communicate over localhost inside this container)
EXPOSE 5000

# Start all services concurrently using PM2 Runtime
CMD ["pm2-runtime", "ecosystem.config.js"]
