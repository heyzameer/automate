FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY packages/logger/package.json ./packages/logger/
COPY services/auth-service/package.json ./services/auth-service/

# Install dependencies
RUN pnpm install

# Copy source
COPY packages/logger ./packages/logger
COPY services/auth-service ./services/auth-service

# Build
RUN pnpm --filter @carbot/logger build
RUN pnpm --filter @carbot/auth-service build

# ---
FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml ./
COPY packages/logger/package.json ./packages/logger/
COPY services/auth-service/package.json ./services/auth-service/

RUN pnpm install --prod

COPY --from=builder /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist

EXPOSE 3001

CMD ["node", "services/auth-service/dist/main.js"]
