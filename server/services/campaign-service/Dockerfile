# Stage 1: Builder
FROM node:20-alpine AS builder
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy packages and service
COPY packages/common ./packages/common
COPY services/campaign-service ./services/campaign-service

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build everything needed
RUN pnpm turbo run build --filter=carbot-campaign-service...

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

RUN addgroup -S nodejs && adduser -S appuser -G nodejs
USER appuser

# Copy built files
COPY --from=builder /app/services/campaign-service/dist ./dist
COPY --from=builder /app/services/campaign-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/common/dist ./node_modules/@carbot/common/dist

EXPOSE 5005
CMD ["node", "dist/main.js"]
