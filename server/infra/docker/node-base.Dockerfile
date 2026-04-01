# Base Dockerfile — used as the foundation for all Node.js services.
# Each service inherits from this so common tooling is only installed once.
#
# Usage in a service Dockerfile:
#   FROM carbot/node-base:18 as base

FROM node:18-alpine AS base

# Install pnpm globally in the base image
RUN npm install -g pnpm@8.15.4

# Set working directory
WORKDIR /app

# Security: run as a non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 appuser

# ─────────────────────────────────────────────────────────────────────────────
# Builder stage — install all dependencies and compile TypeScript
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS builder

# Copy workspace manifests first (better layer caching)
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY turbo.json   ./

# Copy package manifests for all workspaces
COPY packages/common/package.json  ./packages/common/package.json
COPY services/api-gateway/package.json   ./services/api-gateway/package.json
COPY services/auth-service/package.json  ./services/auth-service/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY . .

# Build all packages and services
RUN pnpm run build
