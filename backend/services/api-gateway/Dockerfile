FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml ./
COPY packages/logger/package.json ./packages/logger/
COPY services/api-gateway/package.json ./services/api-gateway/

RUN pnpm install

COPY packages/logger ./packages/logger
COPY services/api-gateway ./services/api-gateway

RUN pnpm --filter @carbot/logger build
RUN pnpm --filter @carbot/api-gateway build

# ---
FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml ./
COPY packages/logger/package.json ./packages/logger/
COPY services/api-gateway/package.json ./services/api-gateway/

RUN pnpm install --prod

COPY --from=builder /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist

EXPOSE 3000

CMD ["node", "services/api-gateway/dist/main.js"]
