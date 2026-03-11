# CarBot AI — SaaS Platform Development Project Brief

## Project Overview

This project builds a cloud-native, multi-tenant SaaS platform for used car dealerships using the MERN stack and modern DevOps practices. The platform powers WhatsApp chatbot automation, inventory intelligence, lead management CRM, marketing campaigns, GST billing, and advanced analytics — all under one roof. The architecture is microservices-based with one dedicated MongoDB database per service. Services communicate asynchronously via domain events using RabbitMQ or Apache Kafka. All components are containerized with Docker and deployed on Kubernetes. An API Gateway handles routing, JWT/OAuth2 enforcement, rate-limiting, and per-tenant request scoping. CI/CD pipelines automate build, test, and deployment for every service. Observability includes centralized logging, distributed tracing with OpenTelemetry, and metrics via Prometheus and Grafana. The platform supports unlimited showroom tenants (SaaS multi-tenancy) with plan-based feature gating (Trial / Basic / Pro / Enterprise). An optional Website Builder Service auto-generates SEO-optimized showroom websites with real-time inventory sync. The work is organized into four phases of five days each.

---

## Scope and Services

**Core Microservices:**
- **Auth Service** — Multi-tenant JWT auth for Super Admin, Showroom Owners, and Staff
- **Inventory Service** — Car listings with VIN, RC, insurance, service history, 360° media, and inventory intelligence
- **WhatsApp Bot Service** — Webhook handler, NLP (Gemini AI), Fuse.js fuzzy search, session state management, EMI calculator, test drive booking
- **Lead & CRM Service** — Lead capture, scoring, Kanban pipeline, agent assignment, call logs, incentive tracking
- **Campaign Service** — WhatsApp/SMS/Email/Social campaigns, festival auto-campaigns, follow-up automation
- **Billing & ERP Service** — GST invoice generation, expense tracking, repair cost management, margin calculator
- **Analytics Service** — Revenue dashboards, sales funnel, agent productivity, marketing ROI, demand heatmap
- **Notification Service** — Cross-service alert dispatcher (WhatsApp, Email, SMS)

**Infrastructure:**
- API Gateway for routing, JWT auth enforcement, rate-limiting, and request logging
- Message broker (RabbitMQ / Kafka) for event-driven communication across services
- Shared Cloudinary CDN for media (images, videos, documents) with per-tenant folder isolation
- React frontend (Showroom Admin Panel) and React frontend (Super Admin Panel)
- Optional: Website Builder Service for auto-generated showroom websites

**Optional Advanced Features:**
- 🌐 **Website Builder Service** (see dedicated section below)
- GraphQL gateway for cross-service data aggregation
- Circuit breakers (Resilience4j pattern in Node)
- Feature flags per tenant plan
- GitOps workflow with ArgoCD

---

## Architecture Summary

- MERN microservices — one MongoDB database per service (no shared database)
- Each service owns its domain: Auth, Inventory, WhatsApp Bot, CRM, Campaigns, Billing, Analytics, Website (optional)
- All inter-service communication via asynchronous domain events (RabbitMQ / Kafka topics)
- Every service is tenant-aware — all queries scoped by `tenant_id` extracted from JWT
- Docker for containerization with reproducible multi-stage builds per service
- Kubernetes for orchestration with Deployments, Services, ConfigMaps, Secrets, and Ingress
- CI/CD pipeline per service: build → test → scan → deploy with rollback support
- Observability stack: centralized logging (ELK / Loki), OpenTelemetry tracing, Prometheus + Grafana metrics
- JWT/OAuth2 enforced at the API Gateway; WhatsApp webhook scoped by `phone_number_id` → tenant lookup
- Per-tenant plan limits enforced at the API Gateway middleware layer
- Gemini AI for NLP query parsing; Fuse.js for in-service fuzzy car search
- Cloudinary for all media storage with per-tenant folder isolation

---

## System Architecture Diagram

```
                        ┌──────────────────────────────────────────────────────┐
                        │                  CARBOT AI PLATFORM                   │
                        │                                                        │
                        │   👑 Super Admin Panel        🏪 Showroom Admin Panel  │
                        │   (React + Vite)              (React + Vite)           │
                        └────────────────┬──────────────────────────┬───────────┘
                                         │                          │
                                         ▼                          ▼
                        ┌──────────────────────────────────────────────────────┐
                        │              API GATEWAY (Express / Kong)             │
                        │  JWT Validation | Rate Limiting | Tenant Scoping      │
                        │  Request Logging | Plan Limit Enforcement             │
                        └───┬──────┬────────┬──────┬──────┬────────┬───────────┘
                            │      │        │      │      │        │
              ┌─────────────┘  ┌───┘  ┌─────┘  ┌──┘  ┌──┘  ┌─────┘
              ▼                ▼      ▼         ▼     ▼     ▼
         ┌────────┐  ┌──────────┐ ┌────────┐ ┌──────┐ ┌─────────┐ ┌─────────┐
         │  Auth  │  │Inventory │ │WhatsApp│ │ CRM  │ │Campaign │ │Billing  │
         │Service │  │ Service  │ │  Bot   │ │Service│ │Service  │ │& ERP    │
         │        │  │          │ │Service │ │      │ │         │ │Service  │
         └───┬────┘  └────┬─────┘ └───┬────┘ └──┬───┘ └────┬────┘ └────┬────┘
             │             │           │          │          │           │
         ┌───▼──┐      ┌───▼──┐   ┌───▼──┐  ┌───▼──┐  ┌───▼──┐   ┌───▼──┐
         │Mongo │      │Mongo │   │Mongo │  │Mongo │  │Mongo │   │Mongo │
         │ DB   │      │ DB   │   │ DB   │  │ DB   │  │ DB   │   │ DB   │
         └──────┘      └──────┘   └──────┘  └──────┘  └──────┘   └──────┘
                                      │
                     ┌────────────────▼───────────────────────┐
                     │        MESSAGE BROKER (RabbitMQ/Kafka)  │
                     │  car.added | lead.created | car.sold    │
                     │  appointment.booked | campaign.sent     │
                     │  insurance.expiring | lead.scored       │
                     └───────┬─────────────────────────────────┘
                             │ (consumed by)
              ┌──────────────┼──────────────────────┐
              ▼              ▼                       ▼
       ┌─────────────┐ ┌───────────┐        ┌──────────────┐
       │ Analytics   │ │Notification│        │Campaign Svc  │
       │ Service     │ │ Service    │        │(auto-triggers)│
       └─────────────┘ └───────────┘        └──────────────┘
                                                              ┌──────────────────┐
                                         [OPTIONAL]          │ Website Builder   │
                                                             │ Service           │
                                                             │ {slug}.carbotai.in│
                                                             └──────────────────┘
```

---

## Phase 1 (Days 1–5): Architecture & Multi-Tenant Foundation

### Phase Objectives

- Define detailed requirements and user stories across all platform domains: inventory, WhatsApp automation, CRM, campaigns, billing, and analytics.
- Identify microservice boundaries, ownership rules, and inter-service interaction contracts (event schemas and REST contracts).
- Design the multi-tenant data isolation strategy — every service scopes all queries by `tenant_id` sourced from JWT.
- Create a high-level architecture diagram showing all services, their dedicated MongoDB instances, the message broker, the API Gateway, and frontend panels.
- Initialize Git repositories and scaffold Node.js/Express projects for each service (Auth, Inventory, WhatsApp Bot, CRM, Campaign, Billing, Analytics, Notification).
- Prepare base Dockerfiles (multi-stage) for each service and a root `docker-compose.yml` for local development with all services and databases.
- Choose and configure testing frameworks (Jest + Supertest per service) and set up CI/CD placeholder pipelines.
- Design the core MongoDB schemas for the Auth Service (Tenant, TenantUser, SuperAdmin) and establish tenant provisioning flow.

### Expected Deliverables

- Requirements specification including user stories for all 7 platform modules and the 3 user roles (Super Admin, Showroom Owner/Staff, End Customer).
- Architecture diagram depicting all microservices, dedicated MongoDB instances, RabbitMQ/Kafka broker, API Gateway, and both frontend panels.
- Initialized Git repositories with stubbed Node/Express boilerplate per service, each runnable independently.
- `docker-compose.yml` launching all services, their MongoDB instances, and the message broker locally.
- Core Auth Service with Tenant registration, TenantUser login, SuperAdmin login, JWT issuance, and plan-limit middleware.
- Multi-tenant middleware (`tenantAuth.middleware.js`) shared across services: JWT decode → attach `tenant_id` → check `is_access_active`.
- Local setup README with environment variable templates (`.env.example`) per service.
- Design report documenting service responsibilities, domain boundaries, data ownership, and technology choices with rationale.

### Key Learning Outcomes

- Architectural design of microservices for a complex SaaS product with multi-tenancy from day one.
- Domain decomposition into bounded contexts: how to draw service boundaries by business capability.
- Multi-service Node.js/Express initialization, shared middleware patterns, and npm dependency management.
- Writing multi-stage Dockerfiles and managing multi-container environments with Docker Compose.
- JWT-based multi-tenant auth: issuing separate tokens for tenant users vs. super admin.
- CI/CD scaffolding and developer workflow planning across many services.

### Evaluation / Grading Criteria

- Completeness and clarity of requirements across all 7 modules and 3 user roles.
- Quality of architecture diagram — correct service boundaries, database ownership, broker topology, and gateway placement.
- Multi-tenant middleware correctness: JWT decode, tenant_id scoping, access_active check, plan-limit enforcement.
- Docker Compose correctness — all services and databases start without error for local development.
- Documentation clarity: justified technology choices, clear service responsibilities, and usable setup instructions.
- Consistent naming conventions and code style across all service scaffolds.

---

## Phase 2 (Days 6–10): Core Microservices — Inventory, WhatsApp Bot & CRM

### Phase Objectives

- Implement full CRUD operations for the Inventory Service: car listings with VIN, RC details, insurance tracking, service history, multi-image/video upload via Cloudinary, and 360° spin image support.
- Build the WhatsApp Bot Service: webhook handler routing by `phone_number_id` → tenant, session state machine (IDLE → MENU → SEARCH → VIEW → BOOK), Gemini AI NLP parser, Fuse.js fuzzy brand/model matching, EMI calculator flow, and test drive booking flow.
- Develop the Lead & CRM Service: auto lead capture from WhatsApp, lead scoring engine (Hot/Warm/Cold), Kanban pipeline stages, agent assignment, call log, and follow-up scheduler.
- Configure the API Gateway to route all service endpoints, enforce JWT on protected routes, validate tenant plan limits, and log all incoming requests.
- Integrate RabbitMQ/Kafka into each service — publish `car.added`, `lead.created`, and `appointment.booked` events; implement basic consumers.
- Write unit and integration tests for all critical endpoints in each service.
- Implement inventory intelligence features: days-in-inventory counter, car aging alerts, slow-mover detection, and profit margin calculator.

### Expected Deliverables

- **Inventory Service**: REST API for full car CRUD, VIN/RC/insurance/service-history endpoints, image/video/360° upload via Cloudinary, price history log, profit margin fields, and aging alert cron job.
- **WhatsApp Bot Service**: Webhook GET (verification) + POST (message handler), full session state machine, NLP integration with Gemini AI, fuzzy search with Fuse.js, EMI calculator chat flow, appointment booking flow, subscription-expired guard.
- **Lead & CRM Service**: Auto lead capture on new WhatsApp contact, lead scoring logic, Kanban pipeline API, agent assignment endpoint, call log API, follow-up scheduler with cron reminders.
- **API Gateway**: Route table for all services, JWT validation middleware, plan-limit middleware, request logging.
- Message broker running locally with published and consumed events for at least 3 domain events.
- JWT authentication enforced on all non-webhook protected routes with role-based access (owner / manager / staff / super_admin).
- API documentation (Postman collection or OpenAPI spec) for all implemented endpoints.
- Automated test results demonstrating correctness of core use cases across all three services.
- Developer guide: how to run services, configure WhatsApp webhook via ngrok locally, and use the Postman collection.

### Key Learning Outcomes

- Building stateful chatbot logic with a session state machine persisted in MongoDB.
- Integrating Gemini AI for natural language query parsing and Fuse.js for fuzzy search within a service.
- Designing MongoDB schemas for multi-tenant inventory with embedded sub-documents (service history, price history, 360° images).
- REST API design: correct HTTP methods, status codes, error formats, and RESTful routing conventions.
- JWT multi-role authentication and middleware chaining in Express.
- Publishing and subscribing to domain events in Node.js using RabbitMQ (amqplib) or Kafka (kafkajs).
- API Gateway as a single entry point: routing, authentication enforcement, and plan-limit control.

### Evaluation / Grading Criteria

- Functional correctness of all CRUD operations and bot conversation flows across services.
- WhatsApp session state machine handles all defined transitions, fallbacks, and reset keywords (MENU, hi, start).
- NLP correctly parses multi-parameter car queries; fuzzy search correctly handles spelling mistakes.
- JWT enforced on all protected routes; webhook routes exempt correctly.
- Tenant data isolation enforced in every DB query — no cross-tenant data leakage possible.
- Code quality: modular controllers, service-layer separation, consistent error handling, and meaningful comments.
- Test coverage covering happy path and key edge cases for each service.
- API Gateway routes all services correctly and rejects unauthorized requests.
- At least 3 domain events published and consumed with correct business outcomes.

---

## Phase 3 (Days 11–15): Campaign Automation, Billing, Notifications & Frontend

### Phase Objectives

- Build the Campaign Service: WhatsApp campaign builder (template + audience filter + scheduler), SMS campaign integration (MSG91), Email campaign support (Resend/Nodemailer), festival auto-campaign engine, auto follow-up sequences (Day 1 / Day 3 / Day 7), abandoned inquiry reminders, new stock broadcast to matched leads, and old customer remarketing flows.
- Implement the Billing & ERP Service: GST invoice generator (PDF via pdfkit/puppeteer), delivery note generator, expense tracking, repair cost management, per-car P&L calculation, and monthly GST/sales reports.
- Build the Notification Service: a dedicated consumer service that listens to domain events and dispatches WhatsApp messages, emails, and SMS notifications — decoupled from all other services.
- Design and implement the Analytics Service: revenue dashboard data, sales funnel analysis, agent productivity metrics, marketing ROI, demand heatmap by area, and slow-moving stock report — aggregated from other services via events and direct DB reads.
- Build the React Showroom Admin Panel with pages for: Dashboard, Car Inventory, Lead CRM (Kanban), Appointments, WhatsApp Bot Preview, Campaigns, Billing/Invoices, Analytics, Settings, and Subscription.
- Build the React Super Admin Panel with pages for: Platform Dashboard, Tenant Management, Access Control, WhatsApp Config per tenant, Form Builder, and Platform Analytics.
- Extend end-to-end tests to cover event-driven workflows across services.
- Optionally implement the Website Builder Service skeleton.

### Expected Deliverables

- **Campaign Service**: Working WhatsApp/SMS/Email campaign flows with audience filtering, scheduling, delivery tracking, and festival auto-trigger with preview-before-send.
- **Billing & ERP Service**: GST invoice generation (PDF download + WhatsApp send), expense tracking CRUD, repair cost management, per-car profit report, and monthly sales report.
- **Notification Service**: Consumer listening to `appointment.booked`, `lead.assigned`, `insurance.expiring`, `car.aged`, `campaign.scheduled` events — dispatching the correct notification per event type.
- **Analytics Service**: REST endpoints returning aggregated data for all 7 dashboard modules (revenue, funnel, agents, marketing ROI, inventory intelligence, growth charts, demand analytics).
- **React Showroom Admin Panel**: Functional UI for all core pages connected to the API Gateway with JWT auth, role-based views, and real data.
- **React Super Admin Panel**: Functional UI for tenant management, access control toggle, WhatsApp config, form builder, and platform analytics.
- Documentation of all event topics, message schemas, consumer responsibilities, and retry/idempotency strategy.
- Optional: Website Builder Service with showroom sub-domain routing and live inventory sync.
- Demo recording or test results showing full cross-service event-driven workflow (e.g., car added → matched leads notified → campaign triggered → analytics updated).

### Key Learning Outcomes

- Designing event-driven workflows for loosely coupled business processes (campaigns, notifications, analytics).
- Building a dedicated Notification Service as a subscriber to domain events — separating dispatch concern from business logic.
- PDF generation in Node.js (pdfkit / puppeteer) for GST-compliant invoices.
- Aggregation pipelines in MongoDB for analytics and reporting.
- React frontend integration against an authenticated API Gateway — handling JWT tokens, role-based UI rendering, and multi-tenant data scoping.
- Consumer robustness: idempotency keys, dead-letter queues, and retry logic for failed message processing.
- Campaign scheduling with cron jobs (node-cron) in a microservices context.

### Evaluation / Grading Criteria

- Campaign Service correctly filters audience, schedules delivery, and tracks sent/delivered/read/failed counts.
- GST invoices are correctly calculated (CGST/SGST/IGST split) and exported as downloadable PDFs.
- Notification Service consumers handle events correctly and dispatch appropriate messages without duplicates.
- Analytics endpoints return correct aggregated data reflecting real system state.
- React panels are functional, connected to real APIs, and enforce role-based access.
- Event documentation clearly describes topic names, payload schemas, and consumer responsibilities.
- Idempotency and error handling demonstrated in at least 2 consumer implementations.
- End-to-end test or demo shows at minimum one complete event chain across 3 services.

---

## Phase 4 (Days 16–20): Deployment, DevOps & Observability

### Phase Objectives

- Containerize all services with optimized multi-stage Dockerfiles; ensure reproducible builds with pinned dependency versions.
- Deploy the full platform to Kubernetes with Deployments, Services, ConfigMaps, Secrets (encrypted), HorizontalPodAutoscalers, and an Ingress controller routing by subdomain.
- Implement per-service CI/CD pipelines (GitHub Actions) to automate: lint → unit test → integration test → Docker build → push to registry → deploy to Kubernetes, with rollback or blue-green strategy.
- Set up centralized logging with ELK Stack or Grafana Loki — all service logs tagged with `service`, `tenant_id`, and `trace_id`.
- Integrate OpenTelemetry tracing across all services — demonstrate a distributed trace from API Gateway through Inventory Service and Notification Service.
- Instrument each service with Prometheus metrics (request count, latency, error rate, queue depth) and build Grafana dashboards.
- Implement per-tenant plan limit enforcement at scale: enforce car count, lead count, and staff count limits efficiently in MongoDB without per-request full scans.
- Conduct final end-to-end testing of all 7 platform modules end to end, prepare demo, and finalize all documentation.
- Optionally implement circuit breakers (opossum), feature flags per tenant plan, and a GitOps workflow with ArgoCD.

### Expected Deliverables

- Docker images for all services published to a container registry (Docker Hub / GHCR) with versioned tags.
- Kubernetes manifests or Helm charts for every service — Deployment, Service, ConfigMap, Secret, HPA, and Ingress rules for `api.carbotai.in`, `panel.carbotai.in`, `admin.carbotai.in`, and optionally `{slug}.carbotai.in`.
- Live Kubernetes deployment accessible via Ingress or port-forward with access instructions and health check endpoints.
- CI/CD pipeline configuration (`.github/workflows/`) for each service with automated lint, test, build, and deploy stages.
- Grafana dashboards showing: per-service request rate, P95 latency, error rate, message broker queue depth, and active tenant count.
- Centralized log queries demonstrating filtering by `tenant_id` and `trace_id` across all services.
- Sample distributed trace showing a multi-service path: WhatsApp Webhook → Bot Service → Inventory Service → Notification Service.
- Final project report: architecture overview, all service responsibilities, deployment topology, lessons learned, updated diagrams, and per-module feature status.
- Optional: circuit breaker demo under simulated downstream failure; feature flag toggling per tenant plan; GitOps repository structure with ArgoCD application manifests.

### Key Learning Outcomes

- Kubernetes operations: Deployments, Services, ConfigMaps, Secrets, HPA, and Ingress for a multi-service SaaS system.
- CI/CD pipeline design for speed, safety, and repeatability across 8+ independent microservices.
- Observability practices: how tracing, metrics, and structured logs work together for fast incident detection and root-cause analysis.
- OpenTelemetry instrumentation in Node.js services and correlating traces across service boundaries.
- Resilience engineering: circuit breakers to prevent cascade failures when downstream services are slow or unavailable.
- GitOps as declarative continuous deployment: Git as the single source of truth for Kubernetes state.
- Horizontal pod autoscaling and resource limit tuning for a multi-tenant SaaS workload.
- End-to-end lifecycle management: from a developer commit to a live feature in production.

### Evaluation / Grading Criteria

- All services deploy successfully to Kubernetes and remain healthy under normal load.
- Ingress correctly routes `panel.carbotai.in`, `admin.carbotai.in`, and `api.carbotai.in` to respective services.
- CI/CD pipelines automate the full lifecycle: tests gate the deploy; failed tests block the release.
- Grafana dashboards provide actionable insight — latency, error rate, queue depth, and tenant activity visible at a glance.
- Distributed traces correlate a request across at least 3 services with correct span hierarchy.
- Centralized logs are filterable by `tenant_id` and `trace_id` to reconstruct any request journey.
- System remains stable under simulated load; HPA correctly scales pods under increased traffic.
- Documentation is comprehensive — a new developer can set up local, staging, and production environments from the README alone.
- Bonus: functioning circuit breaker demo; feature flag per tenant plan; GitOps repository with ArgoCD synced to cluster.

---

## Optional Module — 🌐 Website Builder Service

> **Status: Optional (Pro / Enterprise plan feature)**
> This service can be built in Phase 3 or added post-launch. It is independent of all core services and communicates via events only.

### Overview

The Website Builder Service auto-generates a fully branded, SEO-optimized website for each showroom tenant when they onboard. It reads inventory data from the Inventory Service via events and serves public-facing showroom pages with real-time car listings.

### Service Responsibilities

| Responsibility | Details |
|---------------|---------|
| **Subdomain Routing** | Serve `{slug}.carbotai.in` per tenant — resolved via Ingress wildcard or dynamic routing |
| **Custom Domain** | Accept CNAME mapping of showroom's own domain; provision SSL via cert-manager / Let's Encrypt |
| **Inventory Sync** | Consume `car.added`, `car.updated`, `car.sold` events; maintain read-optimized listing cache |
| **SEO Pages** | Generate HTML pages with meta tags, schema.org Vehicle markup, and XML sitemaps per tenant |
| **360° Viewer** | Serve the interactive spin viewer using the `spin_images[]` array from the Inventory Service |
| **Lead Form** | Accept visitor contact forms → publish `lead.created` event to CRM Service |
| **Blog CMS** | Rich-text blog editor in Showroom Admin Panel; posts stored in Website Service DB |
| **Google Reviews** | Fetch and display reviews via Google Places API per tenant |
| **WhatsApp Widget** | Floating WhatsApp button linking to tenant's WhatsApp bot number |
| **Featured Carousel** | Display pinned/newest cars in an auto-rotating homepage carousel |

### Website Builder — Tech Decisions

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Rendering** | Next.js (SSR/SSG) or Express + EJS | SEO requires server-rendered HTML |
| **Database** | MongoDB (Website Service own DB) | Stores page config, blog posts, domain mappings |
| **Event Consumer** | RabbitMQ / Kafka | Syncs inventory changes without polling Inventory Service |
| **SSL** | cert-manager + Let's Encrypt | Auto-provision for custom domains on Kubernetes |
| **CDN** | Cloudinary | Images already stored there from Inventory Service |
| **SEO** | Schema.org Vehicle markup + meta tags | Rich results in Google for each car listing |

### Website Builder — MongoDB Schema

```js
const WebsitePageSchema = new mongoose.Schema({
  tenant_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  slug:           { type: String, required: true, unique: true },   // "haripriya-cars"
  custom_domain:  { type: String },                                  // "www.haripriyacars.com"
  domain_verified:{ type: Boolean, default: false },
  theme_color:    { type: String, default: '#1e40af' },
  banner_images:  [{ type: String }],                                // Cloudinary URLs
  featured_cars:  [{ type: mongoose.Schema.Types.ObjectId }],        // Pinned car IDs
  google_place_id:{ type: String },
  whatsapp_number:{ type: String },
  blog_posts: [{
    title:       String,
    slug:        String,
    content:     String,
    cover_image: String,
    published_at:Date,
  }],
  seo: {
    meta_title:       { type: String },
    meta_description: { type: String },
    keywords:         [String],
  },
  is_published:   { type: Boolean, default: true },
}, { timestamps: true });
```

### Website Builder — Kubernetes Consideration

```yaml
# Wildcard Ingress for tenant subdomains
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: website-wildcard-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts: ["*.carbotai.in"]
      secretName: wildcard-tls
  rules:
    - host: "*.carbotai.in"
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: website-builder-service
                port:
                  number: 3000
```

---

## Domain Events Reference

All services communicate through the message broker using the following domain events:

| Event Name | Publisher | Consumers | Payload Summary |
|------------|-----------|-----------|----------------|
| `tenant.created` | Auth Service | Notification (send welcome email) | `{ tenant_id, email, showroom_name }` |
| `tenant.access_changed` | Auth Service | All services (cache invalidation) | `{ tenant_id, is_active, plan }` |
| `car.added` | Inventory Service | Campaign (new stock broadcast), Website Builder (sync), Analytics | `{ tenant_id, car_id, brand, model, price }` |
| `car.updated` | Inventory Service | Website Builder (sync), Analytics | `{ tenant_id, car_id, changes }` |
| `car.sold` | Inventory Service | Analytics (revenue), Campaign (remarketing), Website Builder (remove) | `{ tenant_id, car_id, sold_price, profit }` |
| `car.aging_alert` | Inventory Service (cron) | Notification (WhatsApp to owner) | `{ tenant_id, car_id, days_in_stock }` |
| `insurance.expiring` | Inventory Service (cron) | Notification (alert owner) | `{ tenant_id, car_id, expiry_date }` |
| `lead.created` | CRM Service | Notification (alert staff), Analytics, Campaign (follow-up trigger) | `{ tenant_id, lead_id, phone, source }` |
| `lead.scored` | CRM Service | Notification (if hot: alert assigned agent) | `{ tenant_id, lead_id, score, temperature }` |
| `lead.assigned` | CRM Service | Notification (WhatsApp to agent) | `{ tenant_id, lead_id, agent_id }` |
| `appointment.booked` | WhatsApp Bot Service | CRM (create/update lead), Notification (confirm to customer + email to owner), Analytics | `{ tenant_id, appointment_id, phone, date }` |
| `campaign.scheduled` | Campaign Service | Notification (execute send at scheduled time) | `{ tenant_id, campaign_id, audience_ids[], message }` |
| `campaign.sent` | Campaign Service | Analytics (log delivery stats) | `{ tenant_id, campaign_id, stats }` |
| `invoice.created` | Billing Service | Notification (send PDF via WhatsApp/email to customer) | `{ tenant_id, invoice_id, buyer_phone, pdf_url }` |

---

## SaaS Plan Feature Gating (Microservice Enforcement)

Plan limits are enforced at two layers:

1. **API Gateway Middleware** — reads tenant plan from JWT claims; denies feature-group requests for plans below required tier.
2. **Service-Level Middleware** — enforces count limits (max_cars, max_leads_per_month, max_staff) via fast MongoDB count queries with cached values.

| Feature / Service | 🆓 Trial | 🥉 Basic ₹999/mo | 🥈 Pro ₹2499/mo | 🥇 Enterprise ₹4999/mo |
|-------------------|---------|-----------------|----------------|----------------------|
| Cars in Inventory | 10 | 50 | 200 | Unlimited |
| Leads / month | 50 | 300 | 1,000 | Unlimited |
| Staff Accounts | 1 | 3 | 10 | Unlimited |
| WhatsApp Bot | ✅ | ✅ | ✅ | ✅ |
| EMI Calculator Bot | ❌ | ✅ | ✅ | ✅ |
| Basic CRM | ✅ | ✅ | ✅ | ✅ |
| Lead Scoring & Kanban | ❌ | ✅ | ✅ | ✅ |
| Inventory Intelligence | ❌ | ✅ | ✅ | ✅ |
| AI Price Suggestion | ❌ | ❌ | ✅ | ✅ |
| 360° Car View | ❌ | ❌ | ✅ | ✅ |
| Campaign Service | ❌ | WhatsApp only | All channels | All channels |
| Billing / ERP Service | ❌ | ✅ (basic) | ✅ (full) | ✅ (full) |
| Analytics Service | Basic | Standard | Full | Full + Export |
| 🌐 Website Builder | ❌ | Sub-domain only | ✅ + custom domain | ✅ |
| Agent Incentive Tracking | ❌ | ❌ | ✅ | ✅ |
| FB/IG Auto Posting | ❌ | ❌ | ✅ | ✅ |
| Priority Support | ❌ | Email | Email + WhatsApp | Dedicated Manager |

---

## Technology Stack Reference

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend (Showroom Admin)** | React + Vite | Fast modern dashboard for showroom owners |
| **Frontend (Super Admin)** | React + Vite | Platform management for the SaaS owner |
| **Backend Services** | Node.js + Express | REST APIs and webhook handlers per service |
| **Database (per service)** | MongoDB + Mongoose | Flexible schema, one instance per microservice |
| **AI / NLP** | Google Gemini API | Natural language car query parsing, AI price suggestion, caption generation |
| **Fuzzy Search** | Fuse.js | Spelling-mistake-tolerant brand/model matching inside WhatsApp bot |
| **WhatsApp** | Meta WhatsApp Cloud API | Inbound webhook + outbound messages/images/menus per tenant |
| **Media Storage** | Cloudinary | CDN for car images, videos, 360° spin frames, documents — per-tenant folders |
| **Message Broker** | RabbitMQ / Apache Kafka | Asynchronous event-driven communication between services |
| **API Gateway** | Express (custom) / Kong | Routing, JWT auth, rate-limiting, plan-limit enforcement |
| **Auth** | JWT + bcrypt | Separate JWTs for tenant users vs. super admin |
| **Session Store** | MongoDB | WhatsApp bot conversation state — one session per customer per tenant |
| **Email** | Resend / Nodemailer | Onboarding, alerts, appointment confirmations, campaign emails |
| **SMS** | MSG91 / Textlocal | SMS campaigns and transactional alerts |
| **PDF Generation** | pdfkit / Puppeteer | GST invoice and delivery note generation |
| **Encryption** | crypto-js | AES encrypt/decrypt WhatsApp access tokens stored in DB |
| **Cron Jobs** | node-cron | Aging alerts, insurance expiry checks, follow-up message triggers, session cleanup |
| **Containerization** | Docker (multi-stage) | Reproducible builds per service |
| **Orchestration** | Kubernetes | Deployments, Services, ConfigMaps, Secrets, HPA, Ingress |
| **CI/CD** | GitHub Actions | Per-service pipelines: lint → test → build → push → deploy |
| **Logging** | ELK Stack / Grafana Loki | Centralized log aggregation with `tenant_id` + `trace_id` tagging |
| **Tracing** | OpenTelemetry + Jaeger | Distributed cross-service request traces |
| **Metrics** | Prometheus + Grafana | Request rate, latency, error rate, broker queue depth dashboards |
| **Website Builder** *(optional)* | Next.js / Express + EJS | SSR showroom website with SEO per tenant |
| **SSL (Website Builder)** *(optional)* | cert-manager + Let's Encrypt | Auto-provision HTTPS for custom domains |

---

## Project Summary

| Phase | Days | Focus | Key Services Built |
|-------|------|-------|--------------------|
| **Phase 1** | 1–5 | Architecture, multi-tenant foundation, scaffolding | Auth Service, API Gateway, all service skeletons, docker-compose |
| **Phase 2** | 6–10 | Core microservices, WhatsApp bot, inventory intelligence, CRM | Inventory Service, WhatsApp Bot Service, CRM Service |
| **Phase 3** | 11–15 | Campaign automation, billing, notifications, analytics, frontend | Campaign Service, Billing Service, Notification Service, Analytics Service, React panels |
| **Phase 4** | 16–20 | Kubernetes deployment, CI/CD, observability, resilience, final demo | All services deployed, monitoring, tracing, hardening |

> 🌐 **Optional:** Website Builder Service can be developed during Phase 3 or as a post-launch addition for Pro/Enterprise tenants.

> 🚀 **Next Step:** Begin Phase 1 — finalize service boundary decisions, draw the architecture diagram, scaffold Node/Express projects per service, and configure the root `docker-compose.yml`.

---

*Last Updated: March 2026 | CarBot AI Platform — Project Brief v1.0*
