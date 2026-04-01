# CarBot AI — Final Implementation Plan
## Machine Task: CarBot AI — Multi-Tenant SaaS Platform for Car Showrooms

---

## Objective

Build a cloud-native, multi-tenant SaaS platform for used car dealerships using the MERN stack, Docker, Kubernetes, and modern system design principles. The platform automates customer engagement through an AI-powered WhatsApp chatbot, manages car inventory with intelligence, tracks and converts leads, runs multi-channel marketing campaigns, generates GST invoices, and delivers advanced business analytics — all serving multiple showroom tenants on a single shared infrastructure.

This task tests your backend microservices skills, multi-tenant system design, WhatsApp API integration, AI/NLP implementation, event-driven architecture, frontend integration, and full-stack MERN proficiency.

---

## What Are We Actually Building?

**CarBot AI** is an all-in-one SaaS platform that replaces the fragmented, manual tools used by Indian used car showrooms. Today, showroom owners use WhatsApp manually, track inventory on Excel, manage leads on paper, and generate invoices in Word. CarBot AI unifies all of this into one intelligent platform that showrooms subscribe to and use immediately — no developer required.

### The Platform has Three Access Points:

| Portal | URL | Users |
| :--- | :--- | :--- |
| **Super Admin Panel** | `admin.carbotai.in` | Platform owner (you). Manages all tenants, assigns plans, controls WhatsApp configs. |
| **Showroom Admin Panel** | `panel.carbotai.in` | Showroom owners. Manages their own inventory, leads, appointments, campaigns, billing. |
| **WhatsApp Chatbot** | One per showroom (their own WA number) | End customers (car buyers). Search cars, get EMI quotes, book test drives—all on WhatsApp. |

### Multi-Tenancy Model:
- Every showroom is a **Tenant**. They get their own scoped data, their own WhatsApp bot, and a subdomain for their website.
- A single backend handles ALL showrooms. The `phone_number_id` from WhatsApp identifies which showroom a message belongs to.
- **Subscription is manual**: The Super Admin receives payment (UPI/bank), then activates the showroom's access and assigns a plan from the Super Admin Panel. There is no self-service payment gateway.
- Plans: **Trial → Basic (₹999/mo) → Pro (₹2499/mo) → Enterprise (₹4999/mo)**, with increasing limits on cars, leads, and features.

### The 7 Functional Modules:

| # | Module | What It Does |
|---|--------|-------------|
| 1 | **Inventory Management** | Smart car listings with VIN, RC, insurance, service history, 360° media, and profit margin tracking |
| 2 | **WhatsApp Automation** | AI-powered chatbot for car search, EMI quotes, test drive booking, and automated follow-ups |
| 3 | **Lead Management CRM** | Capture leads from WhatsApp/website/social, score them (Hot/Warm/Cold), track pipeline, manage agents |
| 4 | **Website Builder** *(Optional/Pro)* | Auto-generate a branded, SEO-optimized showroom website with live inventory sync |
| 5 | **Marketing Automation** | WhatsApp/Email campaigns, social media auto-posting, festival triggers, remarketing |
| 6 | **Billing & Accounting (Mini ERP)** | GST invoice generation (PDF), expense tracking, repair costs, per-car P&L |
| 7 | **Advanced Analytics** | Revenue dashboards, sales funnels, agent productivity, marketing ROI |

---

## Microservices Architecture

```
                    ┌─────────────────────────────────────────────────────┐
                    │               CARBOT AI PLATFORM                     │
                    │  👑 Super Admin Panel      🏪 Showroom Admin Panel   │
                    │  admin.carbotai.in         panel.carbotai.in         │
                    └────────────┬────────────────────────┬────────────────┘
                                 │                        │
                                 ▼                        ▼
                    ┌─────────────────────────────────────────────────────┐
                    │            API GATEWAY (Express / Kong)              │
                    │  JWT Validation | Rate Limiting | Tenant Scoping     │
                    │  Request Logging | Plan Limit Enforcement            │
                    └───┬──────┬──────┬──────┬──────┬────────┬────────────┘
                        │      │      │      │      │        │
          ┌─────────────┘  ┌───┘  ┌───┘  ┌──┘  ┌──┘  ┌─────┘
          ▼                ▼      ▼       ▼     ▼     ▼
    ┌──────────┐  ┌──────────┐ ┌──────┐ ┌────┐ ┌──────────┐ ┌─────────┐
    │   Auth   │  │Inventory │ │ Bot  │ │CRM │ │Campaign  │ │Billing  │
    │ Service  │  │ Service  │ │Svc   │ │Svc │ │ Service  │ │& ERP    │
    └────┬─────┘  └────┬─────┘ └──┬───┘ └─┬──┘ └────┬─────┘ └────┬────┘
         │              │          │        │         │             │
    ┌────▼───┐      ┌───▼──┐  ┌───▼─┐ ┌───▼─┐  ┌───▼──┐     ┌───▼──┐
    │MongoDB │      │MongoDB│  │Mongo│ │Mongo│  │Mongo │     │Mongo │
    │  DB    │      │  DB   │  │  DB │ │  DB │  │  DB  │     │  DB  │
    └────────┘      └───────┘  └─────┘ └─────┘  └──────┘     └──────┘
                                   │
                  ┌────────────────▼──────────────────────┐
                  │       MESSAGE BROKER (RabbitMQ/Kafka)   │
                  │  car.added | lead.created | car.sold    │
                  │  appointment.booked | campaign.sent     │
                  └──────┬────────────────┬────────────────┘
                         │                │
              ┌──────────▼──┐     ┌───────▼────────┐
              │  Analytics  │     │  Notification  │
              │  Service    │     │  Service       │
              └─────────────┘     └────────────────┘
                                      [OPTIONAL]
                                  ┌────────────────┐
                                  │ Website Builder│
                                  │ {slug}.carbotai│
                                  └────────────────┘
```

### Microservices:
- **Auth Service**: Tenant registration, login, JWT issuance, multi-tenant RBAC, plan-limit middleware, access control checks.
- **Inventory Service**: Full car CRUD, VIN/RC/insurance/service-history tracking, 360° image upload, aging alerts, profit margin, AI price suggestions.
- **WhatsApp Bot Service**: Webhook handler, multi-tenant routing by `phone_number_id`, session state machine, Gemini AI NLP, Fuse.js fuzzy search, EMI calculator, test drive booking.
- **Lead & CRM Service**: Auto lead capture, Hot/Warm/Cold scoring, pipeline tracking, agent assignment, call logs, follow-up scheduler, incentive tracking.
- **Campaign Service**: WhatsApp/Email campaigns, template manager, audience segmenter, scheduler, festival auto-triggers, delivery tracking.
- **Billing & ERP Service**: GST invoice PDF generation, delivery notes, expense tracking, repair cost management, per-car P&L.
- **Analytics Service**: Revenue dashboards, sales funnels, agent KPIs, marketing ROI, inventory intelligence metrics.
- **Notification Service**: Event-driven dispatcher for WhatsApp/Email alerts (appointment confirmations, aging alerts, insurance expiry, lead assignment).
- **API Gateway**: Single entry point — routing, JWT verification, plan-limit enforcement, rate-limiting, request logging.
- **Website Builder Service** *(Optional)*: Auto-generates SEO-optimized showroom websites with event-driven inventory sync, subdomain routing, custom domain + SSL.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Showroom Admin Frontend** | React + Vite | Dashboard for showroom owners |
| **Super Admin Frontend** | React + Vite | Platform management panel |
| **Backend Services** | Node.js + Express | REST APIs and webhook handlers per service |
| **Database** | MongoDB + Mongoose | One instance per microservice |
| **AI / NLP** | Google Gemini API | Natural language car query parsing, AI price suggestions, caption generation |
| **Fuzzy Search** | Fuse.js | Spelling-tolerant brand/model matching for WhatsApp bot |
| **WhatsApp** | Meta WhatsApp Cloud API | Inbound webhook + outbound messages/images per tenant |
| **Media Storage** | Cloudinary | CDN for car images, videos, 360° frames, PDFs — per-tenant folders |
| **Message Broker** | RabbitMQ / Apache Kafka | Async domain events between services |
| **API Gateway** | Express (custom) / Kong | Routing, auth enforcement, rate-limiting |
| **Auth** | JWT + bcrypt | Separate JWTs for tenant users vs. super admin |
| **Session Store** | MongoDB | WhatsApp bot conversation state per customer per tenant |
| **Email** | Resend / Nodemailer | Appointment confirmations, onboarding, campaign emails |
| **PDF Generation** | pdfkit / Puppeteer | GST invoice and delivery note generation |
| **Encryption** | crypto-js | AES encrypt/decrypt WhatsApp access tokens |
| **Cron Jobs** | node-cron | Aging alerts, insurance expiry checks, follow-up triggers, session cleanup |
| **Containerization** | Docker (multi-stage) | Reproducible builds per service |
| **Orchestration** | Kubernetes | Deployments, Services, ConfigMaps, Secrets, HPA, Ingress |
| **CI/CD** | GitHub Actions | Per-service: lint → test → build → push → deploy |
| **Logging** | ELK Stack / Grafana Loki | Centralized logging tagged with `tenant_id` + `trace_id` |
| **Tracing** | OpenTelemetry + Jaeger | Distributed cross-service request traces |
| **Metrics** | Prometheus + Grafana | Request rate, latency, error rate dashboards |
| **Website Builder** *(optional)* | Next.js / Express + EJS | SSR showroom websites per tenant |

---

## MongoDB Schemas (Core)

### Tenant (Each Showroom = 1 Tenant)
*Auth Service DB — Source of truth for access control*
```js
{
  showroom_name, slug, owner_name, owner_email, owner_phone,
  whatsapp_phone_number_id, whatsapp_access_token,  // AES encrypted — set by Super Admin only
  whatsapp_display_number, showroom_address, showroom_city,
  showroom_logo_url, showroom_timings, showroom_contact,
  bot_name, welcome_message,
  is_access_active,      // Super Admin flips this ON after receiving payment
  access_valid_until,    // Bot auto-deactivates after this date
  plan,                  // 'trial' | 'basic' | 'pro' | 'enterprise'
  plan_status,           // 'active' | 'expired' | 'suspended'
  payment_notes,         // "₹999 via UPI ref TXN123" — logged by Super Admin
  max_cars, max_leads_per_month, max_staff_users,
  is_verified, onboarding_step
}
```

### Car (Inventory Service DB)
```js
{
  tenant_id, stock_code, brand, model, year, price, fuel_type, transmission,
  owner, km_driven, color, description, images[], videos[], spin_images[],
  has_360_view, is_available,
  vin, rc_number, rc_owner_name, registration_date, registration_state,
  rc_document_url, rc_expiry, hypothecation, hypothecation_bank,
  insurance_policy_no, insurer_name, insurance_type, insurance_expiry, insurance_doc_url,
  service_history: [{ date, type, cost, service_center, notes, receipts[] }],
  listed_date, view_count, inquiry_count, price_history[],
  ai_suggested_price_min, ai_suggested_price_max, ai_price_verdict,
  purchase_price, refurb_cost, other_expenses, sold_price, sold_date, profit_margin
}
```

### Lead (CRM Service DB)
```js
{
  tenant_id, phone, name, interest, car_id, stock_code,
  status,    // 'new' | 'contacted' | 'test_drive' | 'negotiation' | 'converted' | 'lost'
  score,     // 0–100 auto-calculated
  temperature, // 'hot' | 'warm' | 'cold'
  source,    // 'whatsapp' | 'website' | 'facebook_ad' | 'walkin' | 'phone'
  assigned_to, // TenantUser._id
  call_logs: [{ date, duration, outcome, notes }],
  follow_up_date, notes, documents_collected: [],
  incentive_amount, incentive_status
}
```

### Session (WhatsApp Bot Service DB)
```js
{
  tenant_id, phone,
  state: 'IDLE' | 'MENU' | 'SEARCH_BUDGET' | 'SEARCH_BRAND' | 'VIEW_RESULTS' |
         'CAR_DETAIL' | 'BOOK_DATE' | 'BOOK_CONFIRM' | 'AWAITING_NAME',
  context: { search_filters, current_car_id, booking_details, results_page, customer_name },
  last_active
}
```

### Invoice (Billing Service DB)
```js
{
  tenant_id, invoice_no, invoice_date, type,
  seller_name, seller_gstin, seller_address,
  buyer_name, buyer_phone, buyer_address, buyer_gstin,
  car_id, vin, rc_number, brand, model, year,
  base_price, gst_rate (18%), cgst, sgst, igst, total_amount,
  payment_mode, payment_ref, pdf_url, status
}
```

### Campaign (Campaign Service DB)
```js
{
  tenant_id, name, type: 'whatsapp' | 'email' | 'social',
  status: 'draft' | 'scheduled' | 'running' | 'completed',
  audience: { segment, filters, total_count },
  message: { template_id, body, media_url, variables[] },
  schedule_at, sent_at,
  stats: { sent, delivered, read, failed, replies }
}
```

---

## Domain Events (Async Communication via RabbitMQ / Kafka)

| Event | Publisher | Consumers |
|-------|-----------|-----------|
| `tenant.created` | Auth | Notification (welcome email) |
| `tenant.access_changed` | Auth | All services (cache refresh) |
| `car.added` | Inventory | Campaign (new stock broadcast), Website Builder, Analytics |
| `car.sold` | Inventory | Analytics (revenue), Campaign (remarketing), Website Builder |
| `car.aging_alert` | Inventory (cron) | Notification (WhatsApp to owner) |
| `insurance.expiring` | Inventory (cron) | Notification (alert owner) |
| `lead.created` | CRM | Notification (alert agent), Analytics, Campaign (follow-up) |
| `lead.scored` | CRM | Notification (if Hot: alert assigned agent) |
| `lead.assigned` | CRM | Notification (WhatsApp to agent) |
| `appointment.booked` | WhatsApp Bot | CRM (create/update lead), Notification (confirm to customer + email to owner), Analytics |
| `campaign.scheduled` | Campaign | Notification (execute)  |
| `campaign.sent` | Campaign | Analytics (delivery stats) |
| `invoice.created` | Billing | Notification (send PDF via WhatsApp/email) |

---

## SaaS Plan Tiers & Subscription Model

> **Subscription is managed manually by the Super Admin.**
> There is NO self-service payment. The showroom owner pays via UPI/bank transfer, then contacts the Super Admin, who logs the payment note and activates the account from the Super Admin Panel.

| Feature | 🆓 Trial | 🥉 Basic ₹999/mo | 🥈 Pro ₹2499/mo | 🥇 Enterprise ₹4999/mo |
|---------|---------|-----------------|----------------|----------------------|
| Cars in Inventory | 10 | 50 | 200 | Unlimited |
| Leads / month | 50 | 300 | 1,000 | Unlimited |
| WhatsApp Bot | ✅ | ✅ | ✅ | ✅ |
| Basic CRM (leads + appointments) | ✅ | ✅ | ✅ | ✅ |
| GST Invoice Generator | ❌ | ✅ | ✅ | ✅ |
| Inventory Intelligence (aging, margins) | ❌ | ✅ | ✅ | ✅ |
| EMI Calculator in Bot | ❌ | ✅ | ✅ | ✅ |
| Lead Scoring + Pipeline | ❌ | ✅ | ✅ | ✅ |
| AI Price Suggestion | ❌ | ❌ | ✅ | ✅ |
| 360° Car View | ❌ | ❌ | ✅ | ✅ |
| WhatsApp Campaigns | ❌ | ❌ | ✅ | ✅ |
| Email Campaigns | ❌ | ❌ | ✅ | ✅ |
| FB / IG Auto Posting | ❌ | ❌ | ✅ | ✅ |
| Billing / Full ERP | ❌ | Basic | Full | Full |
| Analytics Dashboard | ❌ | Basic | Full | Full + Export |
| Website Builder | ❌ | Sub-domain | ✅ + Custom Domain | ✅ |
| Incentive Tracking | ❌ | ❌ | ✅ | ✅ |
| Document Collection (KYC via WA) | ❌ | ❌ | ✅ | ✅ |

---

## Milestone Plan

---

## ⚙️ Milestone 1 (Week 1): Multi-Tenant Foundation, Auth Service & API Gateway

### Goal
Build the core multi-tenant infrastructure that every other service depends on. A showroom owner must be able to register, and the Super Admin must be able to activate their account and assign a plan. All services should be scaffolded and runnable locally via Docker Compose.

### What We Are Building Specifically

#### Auth Service
The Auth Service is the identity backbone. Every request to every other service must pass through it (via the API Gateway middleware). It stores Tenants (showrooms), TenantUsers (showroom owners), and the SuperAdmin account.

**Tenant Registration Flow:**
1. Showroom owner registers → creates a `Tenant` record with `is_access_active: false`
2. Super Admin receives payment manually (UPI/bank transfer)
3. Super Admin logs into `admin.carbotai.in`, finds the tenant, records the payment note (e.g., "₹999 via UPI ref TXN123"), selects a plan (Basic/Pro/Enterprise), sets `access_valid_until`, and flips `is_access_active` to `true`
4. An `AccessLog` record is created for audit history
5. Showroom owner can now log in and use the platform

**JWT Strategy:**
- **Tenant JWT**: Signed with `TENANT_JWT_SECRET`. Payload: `{ tenant_id, user_id, role }`. Used for all showroom panel APIs.
- **Super Admin JWT**: Signed with `SUPER_JWT_SECRET`. Payload: `{ admin_id }`. Used for all super admin APIs. Different secret = completely separate auth.

**Plan Limit Enforcement** (middleware applied at API Gateway + service level):
- `planLimit.middleware.js` reads tenant plan from JWT. Counts current car/lead counts in MongoDB. Blocks operation with `403` if limit exceeded.
- Prevents showrooms on Basic plan from adding more than 50 cars even if they try via API.

#### API Gateway
The API Gateway is the single entry point for all client requests. No service is directly exposed to the internet.

- Routes requests to the correct microservice by URL prefix
- Validates JWT on all protected routes before forwarding
- Injects `tenant_id` from JWT into request headers for downstream services
- Enforces plan-based feature gating (e.g., blocks `/api/campaigns` for Basic plan)
- Logs all requests with `tenant_id` + `trace_id` for distributed tracing

#### Super Admin Panel (Milestone 1 Scope)
- Login page (`SUPER_JWT_SECRET` auth)
- Dashboard: Total tenants, active bots, platform-wide signups this month
- Tenant list table: Name, city, plan, access status, expiry date, car count, lead count
- **Access Control Panel**: For each showroom — toggle `is_access_active`, set `access_valid_until` date, assign plan, record payment notes. Full `AccessLog` history visible.
- WhatsApp Config Panel: Input `phone_number_id` + encrypted access token per showroom. "Test Connection" button validates token via WhatsApp API.
- Car Form Builder: Define which fields appear on the "Add Car" form for ALL showrooms (field name, type, required/optional, order). Showrooms cannot customize this — Super Admin defines it universally.

#### Showroom Admin Panel (Milestone 1 Scope)
- Login page + Registration page
- Subscription Page (read-only): Plan status, valid until date, payment instructions, "Contact to Renew" WhatsApp button
- Basic Settings Page: Showroom name, address, city, contact, timings, logo upload, bot welcome message (CANNOT edit WA credentials)

### Tasks
1. Initialize Git monorepo with folders: `auth-service/`, `inventory-service/`, `bot-service/`, `crm-service/`, `campaign-service/`, `billing-service/`, `analytics-service/`, `notification-service/`, `api-gateway/`, `client/` (Showroom Panel), `superadmin/` (Super Admin Panel)
2. Create base `Dockerfile` (multi-stage) for each service
3. Create root `docker-compose.yml` launching all services + their MongoDB instances + RabbitMQ broker
4. Design and implement MongoDB schemas: `Tenant`, `TenantUser`, `SuperAdmin`, `AccessLog`, `FormField`
5. Implement Auth Service:
   - `POST /auth/register` — Tenant self-registration
   - `POST /auth/login` — Tenant user login, returns JWT
   - `POST /super/login` — Super admin login, returns separate JWT
6. Implement `tenantAuth.middleware.js` — verifies tenant JWT, attaches `req.tenant`, checks `is_access_active` and `access_valid_until`
7. Implement `superAuth.middleware.js` — verifies super admin JWT
8. Implement `planLimit.middleware.js` — reads plan from JWT, counts DB records, enforces limits
9. Implement API Gateway routing table for all 8 services
10. Implement Super Admin API routes:
    - `GET /super/tenants` — list all showrooms
    - `GET /super/tenants/:id` — single showroom detail
    - `PATCH /super/tenants/:id/access` — toggle access, set expiry, assign plan, add payment notes
    - `PUT /super/tenants/:id/whatsapp-config` — set WhatsApp credentials (encrypted with AES)
    - `GET/POST/PUT/DELETE /super/form-fields` — car form builder CRUD
11. Build Super Admin Panel React app (Login, Dashboard, Tenant Table, Access Control, WhatsApp Config, Form Builder)
12. Build Showroom Admin Panel React app (Login, Register, Subscription Page, Settings)
13. Write Postman collection + `.env.example` for all services

### Deliverables
- All services scaffolded, each runnable independently with `npm run dev`
- `docker-compose.yml` starts all services, MongoDB instances, and RabbitMQ without errors
- Auth Service fully functional: tenant register, tenant login, super admin login, JWT issuance
- `tenantAuth.middleware.js` correctly scopes all requests by `tenant_id`, checks access, and enforces plan limits
- Super Admin Panel: login, tenant list, access control (activate/plan assign/payment note), WhatsApp config, form builder
- Showroom Panel: login, register, subscription read-only page, settings page
- Postman collection with all Milestone 1 endpoints
- `.env.example` documenting all environment variables per service
- `README.md` with local setup instructions

---

## 🚗 Milestone 2 (Week 2): Inventory Service + WhatsApp Bot Service + CRM Service

### Goal
Build the three core business services — the **Inventory Service** (tracks all cars), the **WhatsApp Bot Service** (handles all customer interactions), and the **Lead & CRM Service** (captures and tracks all customer inquiries). These three services are the heart of the product and deliver the primary value proposition to showrooms.

### What We Are Building Specifically

#### Inventory Service
The Inventory Service manages the complete lifecycle of a car in a showroom, from when it is purchased and added to inventory until it is sold.

**Car Listing Capabilities:**
- Full CRUD for car listings with all fields from the Super Admin-defined form (dynamic field support via FormField schema)
- Multi-image upload (up to 20 images) via Cloudinary with per-tenant folder isolation: `tenant_{id}/cars/`
- Video upload support (walkaround MP4) and YouTube/Drive link acceptance
- 360° spin image upload (24–36 sequential images stored in `spin_images[]` array)
- VIN tracking (17-character validation, uniqueness per tenant)
- RC details: RC number, owner name, registration date, state, RC document upload, expiry dates, hypothecation status
- Insurance tracking: Policy number, insurer, type, expiry date, document upload
- Service history: Multiple service records per car (date, type, cost, service center, notes, receipt uploads)

**Inventory Intelligence:**
- `listed_date` auto-set when car is added; real-time "Days in Inventory" = `today - listed_date`
- Aging color-coding: 🟢 0–30 days / 🟡 31–60 days / 🔴 60+ days
- **Aging Alert Cron Job** (`node-cron`): Runs daily at 9 AM. Finds all tenant cars >30 days in stock. Publishes `car.aging_alert` event to the message broker. Notification Service consumes this and sends WhatsApp message to showroom owner.
- **Insurance Expiry Cron Job**: Runs daily. Finds insurance expiring within 30 days. Publishes `insurance.expiring` event. Notification Service sends alert.
- **Profit Margin Calculator**: `profit = sold_price - (purchase_price + refurb_cost + other_expenses)`. Auto-committed when car is marked sold via `PATCH /api/cars/:id/mark-sold`. Publishes `car.sold` event.
- **AI Price Suggestion**: Calls Gemini API with car details (brand, model, year, km, city). Returns `suggested_min`, `suggested_max`, `verdict`, `reasoning`. Stored on the car document.
- **Price History**: Every time a car's price is changed, append a record to `price_history[]` with old price, new price, timestamp, and who changed it.

#### WhatsApp Bot Service
Each showroom has its own WhatsApp Business number. All those numbers share ONE webhook endpoint. The `phone_number_id` in the incoming payload routes the message to the correct showroom.

**Multi-Tenant Bot Routing:**
```
Meta Webhook → POST /webhook → Extract phone_number_id
→ Tenant.findOne({ whatsapp_phone_number_id }) → get tenant
→ Read/Create Session { tenant_id, phone }
→ Route to correct state handler
→ Reply using tenant.whatsapp_access_token (decrypted) + tenant.whatsapp_phone_number_id
```

**Session State Machine** (state stored in MongoDB per customer per tenant):
- `IDLE` → `MENU` → `SEARCH_BUDGET` / `SEARCH_BRAND` / `SEARCH_FUEL` → `VIEW_RESULTS` → `CAR_DETAIL` → `BOOK_DATE` → `AWAITING_NAME` → `BOOK_CONFIRM` → `IDLE`
- Reset keywords: "hi", "hello", "menu", "start" → always return to `MENU`
- Sessions expire after 24 hours of inactivity (auto-reset to IDLE)

**AI-Powered Car Search (Gemini NLP + Fuse.js):**
- Customer types: "diesel SUV automatic under 10 lakh 2020 onwards"
- Gemini API extracts: `{ brand: null, model: null, fuel_type: "Diesel", transmission: "Automatic", max_price: 1000000, year: 2020, intent: "search" }`
- MongoDB query built from extracted params, scoped to `tenant_id`
- Fuse.js fuzzy matches brand/model to handle spelling mistakes like "creata" → "Creta", "disel" → "Diesel"
- Results paginated (3 per page); customer types "NEXT" for more

**EMI Calculator (Inside Chat):**
- Trigger: customer types "EMI", "loan", or "finance"
- Bot asks for down payment (interactive buttons: ₹50K / ₹1L / Custom)
- Bot asks for tenure (24 / 36 / 48 / 60 months buttons)
- EMI = `P × r(1+r)^n / ((1+r)^n – 1)` at 9% p.a.
- Output: Monthly EMI + Total Payable + Total Interest

**Test Drive Booking Flow:**
- Customer types "YES" after viewing a car → Bot presents date options (Tomorrow / Day After / Custom Date)
- Bot asks for customer name → Saves appointment to DB → Publishes `appointment.booked` event
- Notification Service consumes event: sends confirmation WhatsApp to customer + email to showroom owner
- CRM Service consumes event: creates/updates lead record

**Auto Follow-Up System:**
- Cron job checks leads where `follow_up_date` is due
- Day 1: "Hi {name}! Did you get a chance to think about the {car}?"
- Day 3: "We still have {car} available. Want to schedule a visit?"
- Day 7: "Final reminder — this car may sell soon! 🚨"
- Follow-ups auto-stop when the customer replies

**Subscription Expired Guard:**
- On every incoming message: check `tenant.is_access_active`
- If false or `access_valid_until < now`: Send "⚠️ This bot is currently inactive. Contact showroom: {phone}" and stop processing

#### Lead & CRM Service
Every customer interaction through any channel creates or updates a Lead record. The CRM provides the showroom's sales team with full visibility into their pipeline.

**Lead Capture Sources:**
- WhatsApp Bot: Auto-creates lead on first contact (any new phone number)
- Website Form: Form submission triggers `lead.created` event via API
- Showroom staff can also manually add leads (walk-in, phone call)
- Duplicate detection: Same phone number → update existing lead, not create new one

**Lead Scoring** (automatic):
```
+30 pts: Booked a test drive
+20 pts: Asked for EMI / finance
+20 pts: Viewed specific car details
+15 pts: Replied to follow-up message
+10 pts: Browsed 3+ cars
+10 pts: Shared budget range
-10 pts: Did not reply to follow-up
-20 pts: Replied STOP

Score ≥ 60 = 🔴 Hot | 30–59 = 🟡 Warm | < 30 = 🔵 Cold
```

**Lead Pipeline Stages:**
- New Inquiry → Contacted → Test Drive Scheduled → Negotiation → Deal Closed / Deal Lost
- Stage managed by showroom staff via the CRM view in the admin panel
- No drag-and-drop Kanban — simple status dropdown per lead

**Agent Assignment:**
- Showroom owner assigns a lead to a specific staff member
- Assigned staff gets a WhatsApp notification (via Notification Service)
- CRM shows each agent's active lead count

**Call Log:**
- Staff manually logs calls: date, duration, outcome (`Not Answered / Interested / Not Interested / Callback Needed`), notes
- Full call history visible per lead

**Follow-Up Scheduler:**
- Staff can set a `follow_up_date` per lead
- Dashboard shows overdue follow-ups with a red badge

### Tasks
1. Design and implement extended `Car` schema (VIN, RC, insurance, service history, inventory intelligence, financials)
2. Implement Inventory Service REST API:
   - `POST /api/cars` — add car (with dynamic form field support)
   - `GET /api/cars` — list with filters, pagination, days-in-inventory computed field
   - `GET /api/cars/:id` — single car detail
   - `PUT /api/cars/:id` — edit car
   - `DELETE /api/cars/:id` — delete car
   - `POST /api/cars/:id/images` — Cloudinary image upload (multiple)
   - `POST /api/cars/:id/360-images` — spin image array upload
   - `POST /api/cars/:id/service-history` — add service record
   - `GET /api/cars/:id/ai-price` — fetch Gemini AI price suggestion
   - `PATCH /api/cars/:id/mark-sold` — record sale, calculate profit, publish `car.sold`
   - `GET /api/cars/aging-report` — list all cars sorted by days in stock
   - `GET /api/cars/intelligence` — slow-movers, aging stats, average days-to-sell
3. Set up cron jobs: `car.aging_alert` publisher (daily 9AM), `insurance.expiring` publisher (daily)
4. Implement WhatsApp Bot Service:
   - `GET /webhook` — Meta webhook verification
   - `POST /webhook` — message handler + multi-tenant router
   - Full session state machine (all states and transitions)
   - Gemini AI NLP service (`nlp.service.js`)
   - Fuse.js fuzzy matching service (`fuzzy.service.js`)
   - WhatsApp API service (`whatsapp.service.js`) with per-tenant token decryption
   - EMI calculator chat flow
   - Test drive booking flow
   - Subscription expired guard
   - Auto follow-up cron job
5. Implement Lead & CRM Service:
   - `POST /api/leads` — create lead (from webhook or manual entry)
   - `GET /api/leads` — list with filters (status, score, source, date range)
   - `GET /api/leads/:id` — lead detail + full timeline
   - `PATCH /api/leads/:id` — update status, notes, follow_up_date
   - `PATCH /api/leads/:id/assign` — assign to agent
   - `POST /api/leads/:id/call-log` — log a call
   - Lead scoring engine (auto-runs on every lead update)
   - Duplicate phone detection
6. Configure RabbitMQ: publish `car.added`, `car.sold`, `car.aging_alert`, `insurance.expiring`, `lead.created`, `lead.scored`, `lead.assigned`, `appointment.booked` events
7. Implement basic consumers in Notification Service and Analytics Service
8. Build Showroom Panel pages: Car Inventory (list + add/edit form), Lead CRM table (list, status change, call log, assign agent, follow-up date), Appointment list (confirm/cancel)
9. Write unit + integration tests for all critical endpoints
10. Update Postman collection for all Milestone 2 endpoints

### Deliverables
- **Inventory Service**: Full car CRUD, VIN/RC/insurance/service-history, image/video/360° uploads to Cloudinary, AI price suggestion, aging report, profit margin on sale, car.added/car.sold events published
- **WhatsApp Bot Service**: Webhook routing by `phone_number_id`, full session state machine, Gemini NLP, Fuse.js fuzzy search, EMI calculator, test drive booking, subscription guard, auto follow-up cron
- **Lead & CRM Service**: Auto lead capture from WhatsApp, scoring engine, pipeline stages, agent assignment, call logs, follow-up scheduler
- **Showroom Admin Panel**: Car Inventory page, Lead CRM table, Appointments page
- **Message Broker**: At least 5 domain events published and consumed with correct business outcomes
- **Event-Driven Integration**: `appointment.booked` → creates/updates CRM lead; `car.aging_alert` → Notification Service dispatches WhatsApp message to showroom owner
- API documentation (Postman collection) for all endpoints
- Tests with coverage for all critical paths

---

## 📢 Milestone 3 (Week 3): Campaign Service + Billing & ERP Service + Notification Service + Frontend

### Goal
Build the marketing automation engine, financial tooling, and the centralized notification dispatcher. Complete the Showroom Admin Panel and Super Admin Panel with all pages. Deliver an end-to-end integrated platform where a complete cross-service workflow (car added → matched leads notified → campaign scheduled → invoice generated → analytics updated) can be demonstrated.

### What We Are Building Specifically

#### Campaign Service
The Campaign Service allows showroom owners to reach their lead database through multiple channels with targeted, scheduled messages.

**WhatsApp Campaigns:**
- Create campaigns: select audience segment (All Leads / Hot Leads / Warm Leads / Old Customers / leads interested in specific brand), write/select message template, add media (image/PDF)
- Template variable personalization: `{name}`, `{car_name}`, `{showroom_name}` auto-replaced per recipient
- Schedule campaigns for a specific date and time (stored in MongoDB, triggered by cron)
- On send: dispatch via Meta WhatsApp Cloud API using tenant's credentials
- Track delivery: Sent / Delivered / Read / Failed (updated from WhatsApp webhook status updates)
- Publish `campaign.sent` event → Analytics Service logs stats

**Festival Auto-Campaign Engine:**
- Pre-loaded festival calendar: Diwali, Dussehra, Eid, Christmas, New Year, Holi, etc.
- 3 days before each festival: system auto-drafts a campaign with pre-designed template
- Showroom owner sees "Preview & Send" card in dashboard — no accidental mass messages
- Uses WhatsApp / Email based on plan

**New Stock Broadcast:**
- When a new car is added (`car.added` event): Campaign Service identifies leads whose past search filters match the new car (brand/budget match from Lead schema)
- Option for showroom owner to send "New Arrival" broadcast to matched leads with one click

**Email Campaigns:**
- Build and send email campaigns using Resend / Nodemailer
- Pre-built templates: New stock announcement, Festival offer, Monthly newsletter
- Track open rate and click rate per campaign
- Unsubscribe link auto-handled

**Old Customer Remarketing:**
- Customers who purchased in the past get re-engagement campaigns (6 months / 1 year post-purchase)
- Triggers: Insurance renewal time, service reminder, new arrival matching their previous purchase type

#### Billing & ERP Service
The Billing Service digitizes the financial operations of the showroom — replacing Word invoices and Excel expense sheets.

**GST Invoice Generator:**
- Create invoice when a car is sold: seller info (showroom GSTIN, address), buyer info (name, phone, optional GSTIN), vehicle details (brand, model, year, VIN, RC), financials (base price + GST split: CGST 9% + SGST 9%, or IGST 18% for inter-state), payment mode + reference
- Generate and store PDF via `pdfkit` or `Puppeteer` — uploaded to Cloudinary
- Publish `invoice.created` event → Notification Service sends PDF via WhatsApp/email to the customer
- Auto-sequential invoice numbering: `INV-2026-001`, `INV-2026-002`, ...
- Invoice history: search, filter, download

**Delivery Note Generator:**
- Auto-generate vehicle handover document when car is marked sold
- Checklist: RC copy / Insurance / Service book / Extra keys handed over
- PDF generated and sent to buyer via WhatsApp

**Expense Tracking:**
- Log showroom overhead expenses (Rent, Salaries, Advertising, Utilities, Miscellaneous)
- Log per-car variable expenses linked to a specific car (repair costs, transport, etc.)
- Attach receipt/bill photos
- Monthly summary of fixed vs. variable expenses
- GST input credit flag per expense

**Repair Cost Management:**
- Log all pre-sale repairs per car (mechanic, repair type, cost, before/after photos)
- Auto-contributes to `refurb_cost` on the car's profit calculation

**Reports:**
- Monthly Sales Report: Revenue, COGS, Profit for the month
- GST Report: Output tax collected, input tax credit — exportable as PDF/Excel for CA
- Per-car P&L: Every sold car shows purchase price → all costs → sale price → net profit/loss
- Margin analysis: Best margin cars, worst margin cars, rolling average

#### Notification Service
The Notification Service is a pure consumer — it never initiates notifications on its own. It listens to domain events from the message broker and dispatches the appropriate notification to the right person.

**Events Consumed & Actions:**
- `appointment.booked` → WhatsApp confirmation to customer ("Your appointment is confirmed for 27 Feb at 11 AM at {showroom_address}") + Email to showroom owner
- `lead.assigned` → WhatsApp to agent ("You have a new lead: {name} is interested in {car}. Call: {phone}")
- `car.aging_alert` → WhatsApp to showroom owner ("⚠️ {car} has been in stock for {days} days. Consider repricing.")
- `insurance.expiring` → WhatsApp to showroom owner ("🛡️ Insurance for {car} expires in {days} days")
- `invoice.created` → WhatsApp PDF to buyer + Email to showroom owner
- `campaign.scheduled` → Trigger campaign send at scheduled time (delegates to Campaign Service API)
- `lead.scored` (if Hot) → WhatsApp to assigned agent ("🔴 Hot lead: {name} just booked a test drive!")

**Idempotency & Reliability:**
- Each consumed event carries a unique `event_id`
- Service maintains a `ProcessedEvent` collection to prevent duplicate dispatches (idempotency key)
- Failed notifications go to a dead-letter queue for retry with exponential backoff

#### Complete Showroom Admin Panel (All Remaining Pages)
- **Dashboard**: Total cars, new leads today/this week, pending appointments, recent activity feed, quick stats cards
- **Car Inventory**: Full list with search, filters (brand/status/fuel/price), days-in-inventory badge, aging color coding, profit margin (visible to owner role), "Add Car" dynamic form (fields from FormField API), image gallery management, 360° image upload
- **Lead CRM**: Lead table with filters (status, temperature, source, agent, date), individual lead detail drawer with full timeline (all interactions, call logs, WhatsApp history), status update dropdown, call log form, agent assignment, follow-up date setter, lead score badge (🔴 Hot / 🟡 Warm / 🔵 Cold)
- **Appointments**: Upcoming appointments list, confirm/cancel buttons (triggers WhatsApp confirmation to customer), customer details, car of interest
- **Campaigns**: Campaign list with status badges, "New Campaign" wizard (audience select → message builder → schedule → review → send), delivery stats per campaign, festival auto-campaign preview
- **Billing**: Invoice list with PDF download, "Create Invoice" form (auto-fills from car data), expense tracker, per-car profit table, monthly sales report, GST report export
- **Analytics**: Revenue chart (monthly trend), lead source pie chart, agent performance table, inventory aging chart
- **Settings**: Showroom profile (name, address, logo), bot customization (welcome message, bot name), subscription status (read-only plan info + "Contact to Renew" button)

#### Complete Super Admin Panel (All Remaining Pages)
- **Dashboard**: Platform-wide active tenants, total messages processed, new signups this month, MRR (manually tracked)
- **Tenants**: Full tenant table, click into any showroom to see their cars/leads/appointments (support view), filter by plan/city/status
- **Access Control**: For each tenant — activate/deactivate, set expiry, assign plan, record payment note, view AccessLog history
- **WhatsApp Config**: Per-showroom WA phone_number_id + access token (encrypted), test connection button
- **Form Builder**: Drag-and-drop car form field editor
- **Platform Analytics**: Active tenants over time, message volume, plan distribution chart, geographic distribution (city-wise tenant map)
- **Broadcast Email**: Send announcement to all showroom owners or filter by plan

### Tasks
1. Implement Campaign Service:
   - `POST /api/campaigns` — create campaign (audience + message + schedule)
   - `GET /api/campaigns` — list campaigns for tenant
   - `PATCH /api/campaigns/:id/send` — manually trigger send
   - `GET /api/campaigns/:id/stats` — delivery stats
   - Cron: check scheduled campaigns, trigger send at scheduled time
   - WhatsApp API bulk send with personalization
   - `car.added` consumer → new stock broadcast matching logic
   - Festival calendar + auto-draft trigger
2. Implement Billing & ERP Service:
   - `POST /api/invoices` — create GST invoice (PDF generated, uploaded to Cloudinary, `invoice.created` event published)
   - `GET /api/invoices` — list invoices
   - `GET /api/invoices/:id/pdf` — download PDF
   - `POST /api/expenses` — add expense (overhead or per-car)
   - `GET /api/expenses` — list with filters
   - `GET /api/reports/sales` — monthly sales report data
   - `GET /api/reports/gst` — GST output tax report
   - `GET /api/reports/profit` — per-car P&L data
   - GST calculator (CGST/SGST for intra-state, IGST for inter-state)
   - PDF generation using pdfkit or Puppeteer
3. Implement Notification Service (full consumer implementation):
   - Subscribe to all domain events
   - Dispatch WhatsApp via Meta API (using tenant credentials from Auth Service event payload)
   - Dispatch email via Resend/Nodemailer
   - Idempotency key check (ProcessedEvent collection)
   - Dead-letter queue + retry logic
4. Implement Analytics Service (initial):
   - `GET /api/analytics/revenue` — monthly revenue from Billing Service data
   - `GET /api/analytics/leads` — lead counts by status, source, score
   - `GET /api/analytics/inventory` — aging stats, slow-movers, avg days to sell
   - `GET /api/analytics/agents` — per-agent calls, deals, conversion rate
5. Complete Showroom Admin Panel: Campaign builder UI, Billing/Invoice UI, Analytics charts (Chart.js / Recharts), all pages connected to real APIs
6. Complete Super Admin Panel: Platform Analytics, Broadcast Email, all remaining pages
7. Write event documentation: all topic names, payload schemas, consumer responsibilities
8. End-to-end integration test: Car added → `car.added` event → Campaign Service identifies matching leads → notification dispatched → Analytics updated

### Deliverables
- **Campaign Service**: WhatsApp campaign builder (audience filter + personalization + schedule + stats), festival auto-campaign engine, new stock broadcast, email campaigns
- **Billing & ERP Service**: GST invoice PDF generation and delivery, expense tracking, repair cost management, per-car P&L, sales + GST monthly reports
- **Notification Service**: All domain events consumed, correct notifications dispatched, idempotency enforced, dead-letter queue configured
- **Analytics Service**: Revenue, lead, inventory, and agent analytics endpoints
- **Showroom Admin Panel**: Fully functional with all 8 pages connected to real APIs
- **Super Admin Panel**: Fully functional with all 7 pages connected to real APIs
- **End-to-End Demo**: Complete workflow: new car added → matched leads notified → campaign drafted → car sold → GST invoice generated → PDF sent to customer → analytics updated
- **Event Documentation**: All event topics, payloads, consumer responsibilities, and retry strategy documented

---

## 🚀 Milestone 4 (Week 4): Analytics, Docker, Kubernetes, CI/CD & Observability

### Goal
Harden the full platform for production, containerize all services, deploy to Kubernetes, set up CI/CD pipelines for automated deployment, and implement comprehensive observability (logging, tracing, metrics). Build out the full Analytics Service. Optionally, implement the Website Builder Service.

### What We Are Building Specifically

#### Full Analytics Service
The Analytics Service aggregates data from multiple sources (its own event-sourced store + direct aggregation queries) to power the analytics dashboards.

**Showroom-Level Analytics:**
- **Revenue Dashboard**: Total monthly revenue (from Billing Service events), revenue chart (12-month trend), average sale price, revenue by car type (Sedan/SUV/Hatchback), target vs. actual if set
- **Sales Funnel**: Stage conversion rates (Inquiry → Contacted → Test Drive → Negotiation → Closed), average time spent per stage, drop-off point identification
- **Agent Productivity Leaderboard**: Calls per agent, deals closed, conversion rate %, average response time to new leads, incentives earned
- **Marketing ROI**: Per-campaign leads generated vs. ad spend vs. revenue attributed, cost-per-lead by source, best-performing channel
- **Inventory Intelligence**: Avg days-to-sell by car type/brand, slow-moving stock list (<3 inquiries in 30 days), demand heatmap (which models are searched most in which city)
- **Monthly Growth Charts**: Leads growth MoM, cars sold MoM, revenue growth % MoM, WhatsApp message volume MoM

**Super Admin Platform Analytics:**
- Total active tenants, MRR, ARR, tenant churn rate
- New signups per month, total WhatsApp messages processed
- Top tenants by leads/cars/messages, plan distribution chart
- Geographic distribution of tenants (city-wise)

#### Docker & Kubernetes Deployment

**Docker:**
- Optimized multi-stage `Dockerfile` per service (build → production stage, no devDependencies in final image)
- Pinned base image versions for reproducibility
- `.dockerignore` per service to exclude unnecessary files
- Push all images to Docker Hub / GHCR with semantic version tags (`v1.0.0`, `latest`)

**Kubernetes Manifests (for each service):**
- `Deployment` — specifies image, replicas, resource limits (CPU/memory requests and limits)
- `Service` — ClusterIP for internal communication
- `ConfigMap` — non-sensitive config (service URLs, broker topic names)
- `Secret` — sensitive data (JWT secrets, MongoDB URIs, API keys)
- `HorizontalPodAutoscaler` — auto-scale based on CPU utilization (e.g., Bot Service scales up during peak hours)
- `Ingress` for public-facing routing:
  - `api.carbotai.in` → API Gateway
  - `panel.carbotai.in` → Showroom Admin Panel
  - `admin.carbotai.in` → Super Admin Panel
  - `*.carbotai.in` → Website Builder Service (optional, wildcard)

**Ingress Configuration:**
```yaml
# api.carbotai.in → API Gateway service
# panel.carbotai.in → Showroom Admin Panel service
# admin.carbotai.in → Super Admin Panel service
```

#### CI/CD Pipelines (GitHub Actions)
Per-service pipeline (`.github/workflows/service-name.yml`):
```
1. Trigger: push to main branch (per service path filter)
2. Steps:
   a. Checkout code
   b. Install dependencies
   c. Run ESLint (lint check — fails fast if errors)
   d. Run Jest tests (unit + integration)
   e. Docker build (multi-stage)
   f. Push to registry with commit SHA tag
   g. Update Kubernetes deployment image tag (kubectl set image)
   h. Wait for rollout and verify health checks pass
   i. On failure: rollback to previous deployment (kubectl rollout undo)
```

#### Observability Stack

**Centralized Logging (Grafana Loki / ELK):**
- Every service logs structured JSON: `{ timestamp, level, service, tenant_id, trace_id, message, metadata }`
- All logs ship to Loki via Promtail or to Elasticsearch via Logstash
- Grafana dashboard: filter logs by `tenant_id` to see all activity for one showroom; filter by `trace_id` to reconstruct a full request journey
- Log levels: `info` for business events, `warn` for soft failures, `error` for exceptions with full stack traces

**Distributed Tracing (OpenTelemetry + Jaeger):**
- Every service instrumented with OpenTelemetry SDK
- Each incoming request gets a `trace_id` injected by the API Gateway (or carried from WhatsApp webhook)
- Spans created at service boundaries: API Gateway → Bot Service → Inventory Service → Notification Service
- Sample trace path: "Customer sends WhatsApp message → Bot Service → Gemini NLP call → Inventory Service search → WhatsApp response sent"
- Jaeger UI: visualize the full distributed trace with span durations

**Metrics (Prometheus + Grafana):**
- Each service exposes `/metrics` endpoint (using `prom-client` npm package)
- Metrics collected per service:
  - `http_requests_total` (counter by route + status code)
  - `http_request_duration_seconds` (histogram — use P95 for alerting)
  - `message_broker_queue_depth` (gauge — messages waiting in RabbitMQ queues)
  - `active_tenants_total` (gauge — from Auth Service)
  - `whatsapp_messages_processed_total` (counter — from Bot Service)
- Prometheus scrapes all `/metrics` endpoints on a schedule
- Grafana dashboards: per-service request rate, P95 latency, error rate (4xx/5xx), broker queue depth, active tenant count

**Alerting:**
- Grafana alerting rules: P95 latency > 2s, error rate > 5%, queue depth > 1000 → notify via email/Slack

#### Optional: Website Builder Service (Pro / Enterprise Feature)
The Website Builder Service auto-generates a branded, SEO-optimized website for each showroom tenant when they onboard or upgrade to Pro/Enterprise.

- Subdomain: `{slug}.carbotai.in` (e.g., `haripriya-cars.carbotai.in`)
- Custom domain support: showroom owner adds a CNAME record; SSL auto-provisioned via cert-manager + Let's Encrypt
- Consumes `car.added`, `car.updated`, `car.sold` events → keeps a read-optimized car cache in its own MongoDB
- Server-side rendered (Next.js or Express + EJS) for Google SEO indexability
- Pages: Homepage with featured car carousel + Google Reviews, Car Listing with filters/search, Individual Car Detail with 360° spin viewer
- SEO: Schema.org `Vehicle` markup, auto meta tags, auto-generated XML sitemap, human-readable URL slugs (`/cars/maruti-swift-vxi-2019-petrol-mumbai`)
- Lead Integration: Website contact form → publishes `lead.created` event to CRM Service
- Floating WhatsApp widget linking to showroom's WhatsApp bot number
- Blog CMS: Rich-text editor in Showroom Admin Panel → posts stored in Website Service DB → rendered as SEO blog pages

### Tasks
1. Complete Analytics Service:
   - All analytics endpoints (revenue, funnel, agents, marketing ROI, inventory intelligence, growth)
   - Super admin platform-wide analytics endpoints
   - MongoDB aggregation pipelines for all report types
   - Export to PDF and Excel (for reports)
2. Create optimized multi-stage Dockerfiles for all 10 services
3. Create Kubernetes manifests (Deployment, Service, ConfigMap, Secret, HPA, Ingress) for all services
4. Create GitHub Actions CI/CD pipelines per service (lint → test → build → push → deploy → rollback on failure)
5. Set up Prometheus metrics in all services using `prom-client`
6. Set up OpenTelemetry tracing in all services; configure Jaeger collector
7. Set up centralized logging (Loki + Promtail or ELK)
8. Build Grafana dashboards: per-service metrics dash, distributed trace explorer, log explorer
9. Configure HPA rules for Bot Service and API Gateway
10. Deploy complete platform to Kubernetes cluster; verify all Ingress routes work
11. Conduct end-to-end load test on WhatsApp Bot Service; verify HPA triggers correctly
12. (Optional) Implement Website Builder Service: Next.js SSR, event-driven inventory sync, SEO pages, wildcard Ingress
13. Write final system architecture diagram
14. Complete final README: new developer can set up local + production environment from scratch

### Deliverables
- **Full Analytics Service**: All 7 dashboard modules implemented with real data, export functionality
- **Docker Images**: All services built and published to container registry with version tags
- **Kubernetes Manifests / Helm Charts**: All services deployed successfully to production Kubernetes cluster
- **CI/CD Pipelines**: Per-service GitHub Actions pipelines — tests gate the deploy; failure triggers automatic rollback
- **Grafana Dashboards**: Per-service request rate, P95 latency, error rate, broker queue depth, and tenant activity visible at a glance
- **Distributed Traces**: Sample trace demonstrating full path: WhatsApp Webhook → Bot Service → Inventory Service → Notification Service with correct span hierarchy in Jaeger
- **Centralized Logs**: Filterable by `tenant_id` and `trace_id` to reconstruct any request journey
- **Load Test Results**: Bot Service HPA correctly scales pods under simulated concurrent WhatsApp load
- **Final project documentation**: System architecture diagram, service responsibilities, deployment topology, API reference, DB schemas
- **(Optional)** Website Builder Service: live showroom websites at `{slug}.carbotai.in` with SEO-optimized pages and live inventory sync

---

## Evaluation Criteria

| Criterion | Points |
|-----------|--------|
| Core microservices functionality (Auth, Inventory, Bot, CRM) — CRUD, webhook routing, state machine, tenant isolation | 2.5 |
| Campaign, Billing, and Notification Services — functional campaigns, GST invoice PDF, async event dispatch | 1.5 |
| System design & architecture (API Gateway, async messaging, DB-per-service, multi-tenancy, plan gating) | 2 |
| Frontend integration & role-based access (Showroom Panel + Super Admin Panel connected to real APIs) | 1.5 |
| Dockerization & Kubernetes deployment | 1 |
| Observability (logging with tenant_id tagging, distributed tracing, Prometheus metrics + Grafana dashboards) | 1 |
| Optional: Website Builder, circuit breakers, GitOps with ArgoCD, WebSocket real-time notifications | 0.5 |
| **Total** | **10** |

---

## Optional Advanced Features

- **Real-Time Notifications via WebSockets**: Push new lead alerts and appointment confirmations to the Showroom Admin Panel in real-time using Socket.io (instead of polling).
- **Fraud / Spam Detection**: Flag suspicious bot usage — same number sending 50+ messages in 5 minutes, prevent session abuse.
- **Website Builder with Custom Domain + SSL**: Full cert-manager + Let's Encrypt automation for showroom custom domains.
- **GitOps with ArgoCD**: Declarative Kubernetes deployments synced from a Git repository; ArgoCD auto-deploys on merge to `main`.
- **Circuit Breakers (opossum)**: Prevent cascade failures when Gemini API or WhatsApp API is slow/unavailable. Fallback responses keep the bot functional.
- **AI Auto-Caption for Social Posts**: Generate car listing captions for Facebook/Instagram using Gemini API.
- **Demand Heatmap**: Analyze inquiry data by city/pincode to show showrooms which models are trending in their area.
- **Agent Incentive Tracking**: Configurable commission rules (% of sale or fixed amount); auto-calculated when deal is marked Closed; payout status tracking.

---

## Deliverables Checklist

### Microservices
- [ ] Auth Service (JWT, multi-tenant RBAC, plan gating, access control)
- [ ] Inventory Service (car CRUD, VIN/RC/insurance/service history, 360°, aging, margins)
- [ ] WhatsApp Bot Service (webhook, NLP, session state machine, EMI, booking, follow-ups)
- [ ] Lead & CRM Service (capture, scoring, pipeline, agents, call logs, incentives)
- [ ] Campaign Service (WA/email campaigns, festival triggers, new stock broadcast, analytics)
- [ ] Billing & ERP Service (GST invoice PDF, delivery note, expenses, repair costs, P&L)
- [ ] Analytics Service (revenue, funnel, agents, marketing ROI, inventory intelligence)
- [ ] Notification Service (event consumer, WA/email dispatcher, idempotency, dead-letter queue)

### Infrastructure
- [ ] API Gateway (routing, JWT auth, rate-limiting, plan-limit enforcement, request logging)
- [ ] Message Broker (RabbitMQ / Kafka) with all domain events published and consumed
- [ ] Cloudinary integration for all media (images, videos, 360° frames, PDFs)

### Frontends
- [ ] Showroom Admin Panel (React + Vite) — all 8 pages, connected to real APIs, JWT auth, role-based views
- [ ] Super Admin Panel (React + Vite) — all 7 pages, connected to real APIs, separate JWT auth

### DevOps
- [ ] Optimized multi-stage Dockerfiles for all services
- [ ] `docker-compose.yml` for local development (all services + DBs + broker)
- [ ] Kubernetes manifests (Deployment, Service, ConfigMap, Secret, HPA, Ingress) for all services
- [ ] CI/CD pipelines (GitHub Actions) per service — lint → test → build → push → deploy → rollback

### Observability
- [ ] Structured JSON logging with `tenant_id` + `trace_id` tags, shipped to Loki / ELK
- [ ] OpenTelemetry distributed tracing across all services, visualized in Jaeger
- [ ] Prometheus metrics per service, Grafana dashboards (latency, error rate, queue depth, tenant activity)

### Documentation
- [ ] System architecture diagram (all services, DBs, broker, gateway, frontends, external APIs)
- [ ] API reference (Postman collection or OpenAPI spec) for all endpoints
- [ ] Event documentation (all topic names, payload schemas, consumer responsibilities)
- [ ] DB schema documentation (all collections, key fields, indexes)
- [ ] Deployment guide (local setup, Kubernetes deployment, env vars)

### Optional
- [ ] Website Builder Service (auto-generated showroom websites with live inventory sync)
- [ ] Unit and integration tests for critical service paths

---

## 📌 Quick Task Reference — All 4 Phases

---

### ⚙️ Week 1 — Foundation, Auth & API Gateway

| # | Task |
|---|------|
| 1 | Initialize monorepo — scaffold all service folders with Node/Express boilerplate |
| 2 | Write multi-stage `Dockerfile` per service |
| 3 | Create `docker-compose.yml` — all services + MongoDB instances + RabbitMQ |
| 4 | Design & implement MongoDB schemas: `Tenant`, `TenantUser`, `SuperAdmin`, `AccessLog`, `FormField` |
| 5 | Auth Service — `POST /auth/register`, `POST /auth/login`, `POST /super/login` |
| 6 | Build `tenantAuth.middleware.js` — JWT verify → attach tenant → check access active + expiry |
| 7 | Build `superAuth.middleware.js` — super admin JWT verify |
| 8 | Build `planLimit.middleware.js` — count DB records, enforce plan car/lead limits |
| 9 | API Gateway — route table for all services, JWT enforcement, request logging |
| 10 | Super Admin API — tenant list, access toggle, plan assign, payment notes, WhatsApp config, form builder |
| 11 | Super Admin Panel (React) — Login, Dashboard, Tenant Table, Access Control, WA Config, Form Builder |
| 12 | Showroom Panel (React) — Login, Register, Subscription Page (read-only), Settings |
| 13 | Write `.env.example` per service + Postman collection + README setup guide |

---

### 🚗 Week 2 — Inventory Service, WhatsApp Bot & CRM

| # | Task |
|---|------|
| 1 | Extend `Car` schema — VIN, RC, insurance, service history, spin images, inventory intelligence, financials |
| 2 | Inventory Service CRUD — add/edit/delete/list car, dynamic form field support |
| 3 | Cloudinary upload — multi-image, video, 360° spin image array, RC/insurance documents |
| 4 | Inventory intelligence — days-in-inventory, aging color-code, price history, profit margin on `mark-sold` |
| 5 | Gemini AI price suggestion endpoint — `GET /api/cars/:id/ai-price` |
| 6 | Aging + insurance expiry cron jobs — publish `car.aging_alert` and `insurance.expiring` events |
| 7 | WhatsApp Bot — webhook GET (verify) + POST (multi-tenant router by `phone_number_id`) |
| 8 | Session state machine — all states (IDLE → MENU → SEARCH → VIEW → BOOK → IDLE), 24hr expiry |
| 9 | Gemini NLP service (`nlp.service.js`) — extract brand, model, price, fuel, transmission from natural text |
| 10 | Fuse.js fuzzy matching service (`fuzzy.service.js`) — "creata" → "Creta", "disel" → "Diesel" |
| 11 | EMI calculator chat flow — interactive buttons for down payment + tenure → compute EMI |
| 12 | Test drive booking flow — date picker → name → save appointment → publish `appointment.booked` |
| 13 | Subscription expired guard — check `is_access_active` on every incoming message |
| 14 | Auto follow-up cron — Day 1 / Day 3 / Day 7 messages, stop on customer reply |
| 15 | CRM Service — lead CRUD, auto-capture on new WhatsApp contact, duplicate phone detection |
| 16 | Lead scoring engine — auto-run on every update (Hot ≥60 / Warm 30–59 / Cold <30) |
| 17 | Agent assignment endpoint, call log endpoint, follow-up date setter |
| 18 | Publish events: `car.added`, `car.sold`, `lead.created`, `lead.scored`, `lead.assigned`, `appointment.booked` |
| 19 | Showroom Panel pages — Car Inventory, Lead CRM table, Appointments list |
| 20 | Unit + integration tests for all critical paths; update Postman collection |

---

### 📢 Week 3 — Campaigns, Billing, Notifications & Full Frontend

| # | Task |
|---|------|
| 1 | Campaign Service — create/list/send/stats endpoints |
| 2 | WhatsApp bulk send with `{name}` / `{car_name}` / `{showroom_name}` personalization |
| 3 | Campaign scheduler cron — trigger campaigns at `schedule_at` datetime |
| 4 | Festival auto-campaign engine — pre-loaded calendar, auto-draft 3 days before each festival |
| 5 | New stock broadcast — consume `car.added`, match to leads by brand/budget, one-click notify |
| 6 | Email campaigns — Resend/Nodemailer, open-rate tracking, unsubscribe handling |
| 7 | Old customer remarketing flows — 6-month / 1-year re-engagement |
| 8 | Billing Service — GST invoice generator (CGST/SGST/IGST), PDF via pdfkit/Puppeteer, upload to Cloudinary |
| 9 | Invoice send — publish `invoice.created` → Notification dispatches PDF via WhatsApp + email |
| 10 | Delivery note generator — vehicle handover checklist PDF |
| 11 | Expense tracking CRUD — overhead and per-car variable costs, receipt uploads |
| 12 | Repair cost management — linked to car's `refurb_cost`, before/after photos |
| 13 | Reports — monthly sales, GST output tax, per-car P&L, margin analysis |
| 14 | Notification Service — subscribe to ALL domain events, dispatch WhatsApp / email correctly |
| 15 | Idempotency — `ProcessedEvent` collection to prevent duplicate dispatches |
| 16 | Dead-letter queue — failed notifications retry with exponential backoff |
| 17 | Analytics Service (initial) — revenue, lead counts, inventory aging, agent KPIs endpoints |
| 18 | Complete Showroom Panel — Campaign wizard, Billing/Invoice UI, Analytics charts, all 8 pages live |
| 19 | Complete Super Admin Panel — Platform Analytics, Broadcast Email, all 7 pages live |
| 20 | End-to-end integration test: car added → event → matched leads notified → invoice generated → analytics updated |
| 21 | Write event documentation (all topics, payloads, consumer responsibilities, retry strategy) |

---

### 🚀 Week 4 — Analytics, Docker, Kubernetes, CI/CD & Observability

| # | Task |
|---|------|
| 1 | Analytics Service (full) — revenue dashboard, sales funnel, agent leaderboard, marketing ROI, inventory intelligence, growth charts |
| 2 | Super admin platform analytics — MRR, ARR, churn, plan distribution, top tenants |
| 3 | Export functionality — PDF and Excel reports for sales, GST, P&L |
| 4 | Write optimized multi-stage `Dockerfile` for all 10 services |
| 5 | Write Kubernetes manifests per service — `Deployment`, `Service`, `ConfigMap`, `Secret`, `HPA` |
| 6 | Configure `Ingress` — `api.carbotai.in`, `panel.carbotai.in`, `admin.carbotai.in` |
| 7 | GitHub Actions CI/CD pipeline per service — lint → test → build → push → deploy → rollback |
| 8 | Add `prom-client` metrics to all services — request count, latency histogram, error rate gauge |
| 9 | Instrument all services with OpenTelemetry SDK; configure Jaeger collector |
| 10 | Set up Grafana Loki + Promtail (or ELK) — structured JSON logs with `tenant_id` + `trace_id` |
| 11 | Build Grafana dashboards — per-service P95 latency, error rate, queue depth, active tenant count |
| 12 | Configure HPA rules for Bot Service + API Gateway (CPU-based auto-scaling) |
| 13 | Deploy full platform to Kubernetes; verify all Ingress routes serve correctly |
| 14 | Run load test on WhatsApp Bot Service; confirm HPA scales pods under load |
| 15 | *(Optional)* Website Builder Service — Next.js SSR, event-driven inventory sync, SEO pages, wildcard Ingress, custom domain + SSL |
| 16 | Write final system architecture diagram |
| 17 | Complete final README — local setup + Kubernetes deployment guide from scratch |

---

*CarBot AI Platform — Final Implementation Plan | March 2026*
