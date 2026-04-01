# CarBot AI Platform

Multi-tenant SaaS platform for car showrooms with AI-powered WhatsApp automation.

## Architecture

- **API Gateway**: Entry point for all requests. Handles routing and JWT verification.
- **Auth Service**: Identity and Access Management. Tenant management.
- **Packages/Shared**: Shared middleware and utilities.
- **AutoMoto**: React-based frontend for Super Admin and Showrooms.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` in each service directory.

3. Run locally:
   ```bash
   npm run dev
   ```

4. Run with Docker:
   ```bash
   docker-compose up -d
   ```

## Services

- API Gateway: `http://localhost:5000`
- Auth Service: `http://localhost:5001`
- Frontend: `http://localhost:5173`

## Week 1 Progress

- [x] Monorepo scaffold
- [x] Dockerization
- [x] Auth Service (Register, Login, Super Admin)
- [x] API Gateway proxying
- [x] Super Admin Panel (React)
- [x] Showroom Panel (React)
