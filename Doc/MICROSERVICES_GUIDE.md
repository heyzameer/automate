# 🏛️ CarBot AI — Microservices Architecture & Service Communication Guide

## 1. What Are Microservices?

A traditional application is called a **Monolith** — all the code (auth, inventory, notifications) lives in one big server. If one part crashes, everything crashes.

**Microservices** split your application into small, independent services. Each service:
- Has its **own codebase**
- Has its **own database**
- Runs on its **own port / process**
- Can be **deployed, scaled, and restarted independently**

---

## 2. CarBot's Service Map

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                             │
│          (WhatsApp Meta API / Browser / Postman)            │
└───────────────────────┬─────────────────────────────────────┘
                        │ All external traffic
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   🚪 API Gateway                            │
│                    Port: 5000                               │
│  • JWT verification                                         │
│  • Rate limiting                                            │
│  • Route proxying to internal services                      │
└────┬──────────────────┬─────────────────────┬──────────────┘
     │                  │                     │
     ▼                  ▼                     ▼
┌─────────┐    ┌──────────────────┐   ┌──────────────────────┐
│  Auth   │    │   Inventory      │   │  WhatsApp Bot        │
│ Service │    │   Service        │   │  Service             │
│  :5001  │    │   :5002          │   │  :3003               │
│         │    │                  │   │                      │
│ • Login │    │ • Vehicles CRUD  │   │ • Webhook handler    │
│ • JWT   │    │ • Image uploads  │   │ • WhatsApp messaging │
│ • Tenants│   │ • Form config    │   │ • AI NLP (Gemini)    │
│ • Users │    │ • Brands/Models  │   │ • Booking (Leads)    │
└────┬────┘    └───────┬──────────┘   └──────────┬───────────┘
     │                 │                          │
     ▼                 ▼                          ▼
┌─────────┐    ┌───────────────┐         ┌───────────────────┐
│MongoDB  │    │  MongoDB      │         │ MongoDB (Leads)   │
│carbot   │    │  carbot_      │         │ + Redis (Sessions)│
│_auth    │    │  inventory    │         │                   │
└─────────┘    └───────────────┘         └───────────────────┘
```

---

## 3. Service-to-Service Communication Patterns (What We Use)

There are several ways microservices talk to each other. CarBot uses **two** of them:

### 🔷 Pattern 1: Synchronous HTTP (REST API Calls)
**Used for**: Any communication that needs an immediate response.

This is the most common pattern. One service makes an **HTTP request** to another and waits for the response before continuing.

**In CarBot, this is used for:**

| Caller | Called Service | Purpose |
|--------|---------------|---------|
| `whatsapp-bot-service` | `auth-service` | Look up which Tenant owns a WhatsApp number |
| `whatsapp-bot-service` | `inventory-service` | Search vehicles for a customer query |
| `whatsapp-bot-service` | `whatsapp-bot-service` (self) | Create/cancel/reschedule test drive leads |
| `frontend (React)` | `api-gateway` | All dashboard operations |
| `api-gateway` | `auth-service` | Proxy login/register requests |
| `api-gateway` | `inventory-service` | Proxy vehicle CRUD requests |

**Code Example (in BotService.ts):**
```typescript
// Bot calls Auth Service to find the tenant for this WhatsApp number
const tenantRes = await authServiceClient.get(`/internal/tenants/whatsapp/${phoneNumberId}`);
const tenant = tenantRes.data?.data;

// Bot calls Inventory Service to search vehicles
const res = await inventoryServiceClient.get('/internal/vehicles', {
    params: { tenantId, brand: 'Tata', fuel_type: 'Electric' }
});
```

---

### 🔷 Pattern 2: In-Memory State (Redis)
**Used for**: Fast, temporary, real-time state (Bot conversational sessions).

Instead of writing to a disk-based database (MongoDB), some data is better kept in **RAM** using Redis — an in-memory key-value store. This is ideal for data that changes very frequently and needs to be read in milliseconds.

**In CarBot, Redis stores:**
- **Bot Sessions** — Which state is a customer in? (`AWAITING_NAME`, `BOOK_DATE`, etc.)
- **Session Context** — What car are they looking at? What name did they give?

**Before Redis (Bad):**
```
User sends msg → Bot reads MongoDB (40ms disk I/O) → crashes if 2 msgs arrive at once
```

**After Redis (Good):**
```
User sends msg → Bot reads Redis RAM (< 1ms) → zero race conditions
```

**Code Example:**
```typescript
// Save session to Redis RAM with 24-hour expiry
await redisClient.set(`session:${tenantId}:${phone}`, JSON.stringify(session), 'EX', 86400);

// Read session from Redis RAM
const sessionData = await redisClient.get(`session:${tenantId}:${phone}`);
const session = JSON.parse(sessionData);
```

---

## 4. The Security Layer — Internal Service Mesh

When services call each other internally, they should NOT use the same public JWT tokens that users use. We use a **Shared Secret** pattern instead.

Every internal API call includes a special header:
```
x-internal-secret: carbot-internal-super-secret
```

Each internal route validates this header before responding:
```typescript
router.use((req, res, next) => {
    if (req.headers['x-internal-secret'] !== 'carbot-internal-super-secret') {
        return res.status(403).json({ message: 'Forbidden: Internal Only' });
    }
    next();
});
```

**Routes are mounted separately from public routes:**
- Public routes: `POST /api/v1/auth/login` (requires JWT)
- Internal routes: `GET /internal/tenants/whatsapp/:id` (requires secret header)

---

## 5. Patterns We Are NOT Using Yet (Future Scale)

### 📦 Async Messaging (Event-Driven / Pub-Sub)
**What it is**: Instead of Service A waiting for Service B to respond, A fires an event ("I just added a new car!") and moves on. B picks it up from a queue when it's ready.

**Tools**: RabbitMQ (already in `docker-compose.yml`), Redis Pub/Sub, or Apache Kafka.

**Use case in CarBot**:
- When a showroom adds a new car → auto-notify leads who were waiting for that brand
- When a lead is cancelled → trigger a follow-up workflow

### 🔍 Service Discovery
**What it is**: Instead of hardcoding `http://localhost:5001`, services register themselves in a central registry (like Consul or Kubernetes DNS). Other services look up the address dynamically.

**Current CarBot approach**: URLs are hardcoded in `.env` files. Good for local dev, needs proper service discovery in production (e.g. Docker Compose network names or Kubernetes services).

---

## 6. Current Communication Summary Table

| From | To | Method | Auth | Data Format |
|------|----|--------|------|-------------|
| Browser | API Gateway | HTTP REST | JWT Token | JSON |
| API Gateway | Auth Service | HTTP Proxy | JWT Forward | JSON |
| API Gateway | Inventory Service | HTTP Proxy | JWT Forward | JSON/Multipart |
| Bot Service | Auth Service | HTTP GET | x-internal-secret | JSON |
| Bot Service | Inventory Service | HTTP GET | x-internal-secret | JSON |
| Bot Service | Bot Service (self) | HTTP GET/POST/PATCH | x-internal-secret | JSON |
| Bot Service | Redis | TCP (ioredis) | None (local) | String (JSON) |
| Meta WhatsApp API | API Gateway | HTTP POST Webhook | Verify Token | JSON |

---

## 7. Quick Glossary

| Term | Meaning |
|------|---------|
| **API Gateway** | The single front door. All external traffic goes through here |
| **Service Mesh** | Internal network of services — how services talk to each other |
| **Shared Secret** | A password baked into headers for internal service auth |
| **Redis** | An in-memory key-value store. Blazing fast for temporary data |
| **Pub/Sub** | Publish-Subscribe pattern — async event-driven messaging |
| **Synchronous** | Service A waits for Service B to respond before continuing |
| **Asynchronous** | Service A fires an event and continues without waiting |
| **Idempotent** | Calling the same API twice has the same result as calling it once |
| **Circuit Breaker** | If Service B is down, stop calling it and return a fallback |
| **Tenancy** | Each "showroom" (tenant) has isolated data under one platform |

---

---

# 🤖 Part 2: CarBot WhatsApp Bot — Deep Dive Q&A

---

## Q1: How does the WhatsApp bot receive messages from customers?

**Answer:**

When a customer sends a WhatsApp message, Meta's servers send an HTTP `POST` request to our public webhook URL. The flow is:

```
Customer types "Hi" on WhatsApp
        ↓
Meta's servers POST to:
  https://your-tunnel.serveo.net/api/v1/bot/webhooks
        ↓
API Gateway receives it and proxies to:
  http://localhost:3003/api/v1/bot/webhooks  (whatsapp-bot-service)
        ↓
WebhookController.handleWebhook() extracts:
  - from (customer phone number)
  - phoneNumberId (which WhatsApp business number received it)
  - messageBody (what the customer typed)
        ↓
Hands off to BotService.handleIncomingMessage()
```

Meta also sends a `GET` request first to "verify" your webhook when you register it in the Meta Developer Portal. We verify it using the `WHATSAPP_VERIFY_TOKEN` from our `.env`.

---

## Q2: How does the bot know WHICH showroom a message belongs to? (Multi-Tenancy)

**Answer:**

Every WhatsApp Business Account has a unique `phoneNumberId`. When Meta sends us a webhook, it includes this ID. The bot uses it to look up which Tenant (showroom) owns that number:

```typescript
// BotService.ts
const tenantRes = await authServiceClient.get(
    `/internal/tenants/whatsapp/${phoneNumberId}`
);
const tenant = tenantRes.data?.data;
```

The `Tenant` document in MongoDB stores:
```json
{
  "name": "Unique Cars",
  "whatsappConfig": {
    "phoneNumberId": "1052111457987266",
    "accessToken": "EAABs...",
    "greetingMessage": "Welcome to Unique Cars!"
  }
}
```

This is how **one single bot service** handles hundreds of different showrooms without getting confused. Every response is sent back using that tenant's own `accessToken` and `phoneNumberId`.

---

## Q3: How does the bot remember what a customer was doing? (State Machine)

**Answer:**

The bot uses a **Finite State Machine (FSM)** pattern. Every customer has a "session" stored in Redis. The session has a `state` field that tells the bot what the customer is currently doing:

```
IDLE          → Customer just arrived, no active flow
MENU          → Customer is looking at the main menu
SEARCH_BUDGET → Bot asked "What is your budget?"
AWAITING_NAME → Bot asked "What is your name?" (booking flow)
BOOK_DATE     → Bot asked "What date for test drive?"
CAR_DETAIL    → Customer is viewing a car's details
RESCHEDULE_DATE → Customer is rescheduling a booking
```

**Example flow:**
```
Customer: "I want to book a test drive"
  → state becomes CAR_DETAIL (they pick a car first)

Customer: "BOOK"
  → state becomes AWAITING_NAME

Customer: "Zameer"
  → state becomes BOOK_DATE
  → bot saves name in session.context.lead_name = "Zameer"

Customer: "5th April, 10 AM"
  → bot reads session.context.lead_name
  → creates Lead in DB with name="Zameer", date="5th April, 10 AM"
  → state resets to IDLE
```

Without this state machine, the bot would not know WHY the customer typed "Zameer" — was it a car name? A city? The state tells the bot exactly what to expect next.

---

## Q4: Where exactly is Gemini AI used? Is it used for every message?

**Answer:**

**No — Gemini is NOT used for every message.** That would be expensive and slow. We use a **Hybrid State Machine + AI** architecture.

### When Gemini IS called:
Only when the customer ignores all buttons and types a raw, unstructured sentence in the `default` (fallback) state:
- *"Do you have any electric cars under 15 lakhs?"*
- *"Show me Tata SUVs with automatic transmission"*
- *"Airplane"* (irrelevant query)

### When Gemini is NOT called (fast-path):
- Customer types "hi", "menu", "start" → instant menu
- Customer clicks an interactive button → deterministic switch/case
- Customer types a car code like "car02" → instant regex match
- Customer is in `AWAITING_NAME`, `BOOK_DATE` etc. → direct state handler

### How Gemini works as an "Extraction Engine":
Gemini does NOT write the bot's reply. It only **extracts structured data** from a messy human sentence:

```
Input:  "any tata electric suv under 20 lakh automatic"

Gemini Output (JSON):
{
  "brand": "Tata",
  "fuel_type": "Electric",
  "max_price": 2000000,
  "transmission": "Automatic",
  "intent": "search"
}
```

Then our Node.js code takes that JSON and runs a **native MongoDB query**. The customer never waits for Gemini to "write an answer" — Gemini is just a fast parameter parser.

### Special intents Gemini detects:
| Intent | Meaning | Bot Action |
|--------|---------|------------|
| `search` | Customer wants to find a car | Run vehicle search with filters |
| `greeting` | "Hello", "Thanks" etc. | Show the main menu |
| `irrelevant` | "Pizza", "Airplane" etc. | Politely decline and redirect |
| `book` | Customer wants to book | Start booking flow |
| `menu` | Customer wants options | Show main menu |

---

## Q5: What happens when the bot gets an irrelevant message like "Airplane"?

**Answer:**

Before our fix, the bot would run an empty search and show random cars. Now:

1. The message reaches the `processNaturalQuery()` fallback
2. Gemini receives the message and detects: `"intent": "irrelevant"`
3. The bot checks for this and sends a polite redirect:

```
"🙏 I am an AI concierge exclusively trained to assist you 
with car sales, inventory, and test drives! Please let me 
know what kind of car you are looking for, or type MENU 
to browse our showroom."
```

**Code path:**
```typescript
if (nlpResult.intent === 'irrelevant') {
    return this.whatsappService.sendTextMessage(
        to,
        "🙏 I am an AI concierge...",
        ...
    );
}
```

---

## Q6: How does the bot send interactive buttons and menus?

**Answer:**

WhatsApp's Meta Cloud API supports three types of interactive messages:

### 1. Interactive List (Main Menu)
Used for showing the main menu with multiple categories and options.
```typescript
await whatsappService.sendInteractiveList(
    to, "Welcome!", sections,
    phoneNumberId, accessToken
);
```
This renders as a "View Options" button that opens a scrollable list.

### 2. Interactive Buttons (Quick Actions)
Used for 2–3 quick action buttons, like on a booking card:
```typescript
await whatsappService.sendInteractiveButtons(
    to, "🚗 Maruti Swift\n🗓️ 5th April",
    [
        { id: 'RESCHEDULE_LEAD_abc123', title: '🗓️ Reschedule' },
        { id: 'CANCEL_LEAD_abc123',    title: '❌ Cancel' }
    ],
    phoneNumberId, accessToken
);
```

### 3. Plain Text Message
Used for search results, car details, confirmations:
```typescript
await whatsappService.sendTextMessage(to, "🔍 Found 3 cars...", ...);
```

When a customer taps a button, Meta sends a webhook with the button's `id` (e.g. `CANCEL_LEAD_abc123`). The bot parses this ID and knows exactly what action to take.

---

## Q7: How does the Test Drive booking flow work end-to-end?

**Answer:**

```
1. Customer: "car02"
   → Bot fetches vehicle detail from inventory-service
   → Shows: "🚗 Hyundai Creta SX | ₹12,50,000 | Reply BOOK"
   → session.state = 'CAR_DETAIL'
   → session.context.current_car_id = "vehicle-mongo-id"

2. Customer: "BOOK"
   → Bot detects state is CAR_DETAIL
   → Asks: "🚙 Great! What is your name?"
   → session.state = 'AWAITING_NAME'

3. Customer: "Zameer"
   → Bot saves: session.context.lead_name = "Zameer"
   → Asks: "Thanks Zameer! 🗓️ What date for test drive?"
   → session.state = 'BOOK_DATE'

4. Customer: "5th April, 10 AM"
   → Bot POSTs to /internal/leads:
     { tenantId, phone, name: "Zameer", vehicleId, date: "5th April, 10 AM" }
   → Lead appears in Showroom CRM dashboard immediately
   → Bot replies: "✅ Test Drive Requested! We'll call you to confirm."
   → session.state = 'IDLE', context cleared

5. Showroom Admin sees lead in CRM, calls customer to confirm
```

---

## Q8: How does the customer reschedule or cancel using WhatsApp?

**Answer:**

```
Customer: "MENU" → selects "📅 My Bookings"
   ↓
Bot calls: GET /internal/leads?tenantId=xxx&phone=918762763109
   ↓
For each active booking, bot sends an interactive button card:
  "🚗 Hyundai Creta SX
   🗓️ 5th April, 10 AM"
  [🗓️ Reschedule] [❌ Cancel]

── If customer taps CANCEL ──
  Button ID: "CANCEL_LEAD_abc123"
  Bot: PATCH /internal/leads/abc123 { status: 'cancelled' }
  Bot: "❌ Your booking has been cancelled."

── If customer taps RESCHEDULE ──
  Button ID: "RESCHEDULE_LEAD_abc123"
  session.state = 'RESCHEDULE_DATE'
  session.context.rescheduling_id = "abc123"
  Bot asks: "🗓️ What is the new date you prefer?"

  Customer: "7th April, 2 PM"
  Bot: PATCH /internal/leads/abc123 { date: "7th April, 2PM", status: 'rescheduled' }
  Bot: "🗓️ Booking Rescheduled! See you on 7th April."
```

---

## Q9: How is the inventory search so fast without full-text search?

**Answer:**

We use **MongoDB regex filters** on indexed fields. When Gemini extracts `brand: "Tata"`, we build:

```typescript
const filters = {
    tenantId: "abc123",
    status: "available",
    'attributes.brand': new RegExp("Tata", 'i'),       // case-insensitive
    'attributes.fuel_type': new RegExp("Electric", 'i'),
    'attributes.price': { $lte: 2000000 }
};

const vehicles = await Vehicle.find(filters).limit(5);
```

MongoDB's compound indexes on `tenantId` + `attributes.car_code` make lookups near-instant. For production scale with 100,000+ vehicles, we would migrate to **Elasticsearch** for full-text fuzzy search — our polyglot-ready architecture already supports this.

---

## Q10: Why does the bot use `session.tenantId` instead of `tenant._id` in method calls?

**Answer:**

This is a real bug we fixed! The `Tenant` model in the auth-service has a `toJSON` transform:

```typescript
toJSON: {
    transform: function (doc, ret) {
        ret.id = ret._id;   // rename _id to id
        delete ret._id;     // DELETE _id from JSON
    }
}
```

When the bot fetches a tenant over HTTP (as JSON), the `_id` field is gone — only `id` exists. If we wrote `tenant._id.toString()`, it would crash with:

```
TypeError: Cannot read properties of undefined (reading 'toString')
```

**The fix:** Normalize the ID once at the top of `handleIncomingMessage`:
```typescript
const tenantId = (tenant.id || tenant._id)?.toString();
```

Then store it in the session:
```typescript
session = { tenantId, phone, state: 'IDLE', ... }
```

All private methods then use `session.tenantId` — which is safe, pre-normalized, and always a string.

---

## Q11: How does JWT Authentication work across the services?

**Answer:**

JWT (JSON Web Token) is a signed token that proves who you are without needing a database call on every request.

### Login Flow:
```
1. Admin submits:  POST /api/v1/auth/login { email, password }
2. API Gateway proxies to auth-service
3. auth-service verifies password with bcrypt
4. auth-service signs a JWT:
   {
     "userId": "abc",
     "tenantId": "xyz",
     "role": "ADMIN",
     "exp": 1712000000   ← expiry timestamp
   }
   signed with JWT_SECRET="supersecretjwtkeyforcarbotai2024"
5. Returns token to browser
6. Browser stores it and sends it on every future request:
   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### Verification Flow (API Gateway + Services):
```
Browser: GET /api/v1/inventory/vehicles
  + Header: Authorization: Bearer <token>
        ↓
API Gateway middleware: verifies signature using JWT_SECRET
  - If valid: extracts payload, attaches req.user = { userId, tenantId, role }
  - If invalid/expired: returns 401 Unauthorized immediately
        ↓
Proxied to inventory-service (already trusted since it came through Gateway)
inventory-service: uses req.user.tenantId to filter vehicles
```

### Why services share the same JWT_SECRET:
Both the **API Gateway** and **Auth Service** use the exact same `JWT_SECRET` env var. This allows any service behind the gateway to also verify tokens independently — they don't need to call the auth service on every request.

---

## Q12: How does the Vehicle `attributes` Map pattern work? Why not fixed columns?

**Answer:**

Cars have wildly different specifications. A Tata Nexon EV has `battery_capacity`, while a Maruti Swift doesn't. A vintage car has `restoration_year`, while a new car doesn't.

If we used fixed columns like in a SQL table:
```sql
-- This would require ALTER TABLE for every new feature
brand VARCHAR, model VARCHAR, fuel_type VARCHAR, sunroof BOOLEAN, battery_capacity INT ...
```

Instead, we use MongoDB's **Schema-less Map** pattern:
```typescript
attributes: {
    type: Map,          // Any key-value pairs allowed
    of: Schema.Types.Mixed,  // Any data type per value
    default: {}
}
```

Now a vehicle's attributes can be anything the showroom needs:
```json
{
    "brand": "Tata",
    "model": "Nexon EV",
    "price": 1450000,
    "fuel_type": "Electric",
    "battery_capacity": "40.5 kWh",
    "range_km": 465,
    "sunroof": true,
    "car_code": "car03"
}
```

**The Form Config System**: The `FormConfig` collection stores which fields exist, their type, label, and validation rules. The showroom admin can add custom fields (like `leather_seats`) from the Super Admin panel — no code deployment needed.

**Reading attributes in code:**
```typescript
// MongoDB Map requires .get() method
const brand = vehicle.attributes.get('brand');
const price = vehicle.attributes.get('price');

// But after JSON serialization (over HTTP), it becomes a plain object:
const brand = attrs.brand;    // direct property access works
```

---

## Q13: How do vehicle images work? (Cloudinary Pipeline)

**Answer:**

Images are stored on **Cloudinary** (a cloud CDN), not in MongoDB. MongoDB only stores the Cloudinary URLs.

### Upload Flow:
```
1. Admin selects images in the AddVehicle form
2. Frontend sends multipart/form-data to:
   POST /api/v1/inventory/images/upload
3. API Gateway streams the multipart body to inventory-service
   (special middleware bypasses JSON parsing for multipart)
4. inventory-service uses multer + cloudinary-storage to:
   - Receive the file stream
   - Upload directly to Cloudinary (cloud CDN)
   - Receive back a secure HTTPS URL
5. URL returned to frontend: https://res.cloudinary.com/deb9pdn3c/image/upload/...
6. Frontend stores URL and submits it with the vehicle JSON payload
7. Vehicle saved in MongoDB with: images: ["https://res.cloudinary.com/..."]
```

### Why not store images in MongoDB?
- MongoDB documents have a 16MB limit
- Binary image data is slow to query
- Cloudinary provides automatic resizing, compression, CDN delivery

### Why stream through the Gateway?
Because the multipart content-type header must be preserved end-to-end for multer to parse it correctly. The API Gateway uses `http-proxy-middleware` with a special config to stream the body without buffering it.

---

## Q14: What is the `tenantPlugin` and how does it enforce data isolation?

**Answer:**

Multi-tenancy means multiple showrooms share the same database, but each showroom must ONLY see its own data. The `tenantPlugin` is a Mongoose plugin in `@carbot/common` that automatically adds `tenantId` to every query.

Without it:
```typescript
// Dangerous! Returns ALL showrooms' vehicles
const vehicles = await Vehicle.find({ status: 'available' });
```

With `tenantPlugin`:
```typescript
vehicleSchema.plugin(tenantPlugin);

// Now this automatically becomes:
// Vehicle.find({ tenantId: req.user.tenantId, status: 'available' })
const vehicles = await Vehicle.find({ status: 'available' });
```

**How it works internally:**
```typescript
// @carbot/common/src/plugins/tenantPlugin.ts
export function tenantPlugin(schema) {
    schema.pre('find', function() {
        if (this._conditions.tenantId === undefined && currentTenantId) {
            this._conditions.tenantId = currentTenantId;
        }
    });
}
```

The `tenantId` comes from the JWT token on each request. This is how one MongoDB collection (`vehicles`) safely serves 500 different showrooms without any showroom seeing another's inventory.

---

## Q15: How secure is the `x-internal-secret` approach? Is it production-ready?

**Answer:**

**For local development and early production: Yes, it's secure enough.**

The shared secret `carbot-internal-super-secret` is only transmitted on the internal network — never exposed to the internet. External users can only reach internal routes if they somehow bypass the API Gateway (which doesn't proxy `/internal` routes).

**Current security level:**
```
Internet → API Gateway → [JWT protected] → services
Internet ✗→ /internal   (no proxy route exists, never exposed)
Service A → Service B → x-internal-secret header → validated
```

**For enterprise production, the upgrade path is:**

| Level | Solution |
|-------|---------|
| Level 1 (Current) | Shared secret in headers |
| Level 2 | Rotate secrets via env vars + secret manager (AWS Secrets Manager) |
| Level 3 | mTLS — mutual TLS certificates between services |
| Level 4 | Service mesh like Istio/Linkerd — automatic zero-trust networking |

**Important**: In production, the secret should come from an environment variable, not be hardcoded:
```typescript
// ✅ Production pattern (to implement)
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;
// loaded from AWS Secrets Manager / Vault / Kubernetes Secret
```

---

## Q16: What is CQRS and are we following it?

**Answer:**

**CQRS = Command Query Responsibility Segregation**

It means you separate:
- **Commands** (writes: create, update, delete) → go to one handler
- **Queries** (reads: search, list, fetch) → go to another handler

### CarBot's "CQRS-Lite" approach:

| Operation | Service | Database |
|-----------|---------|---------|
| Create vehicle | `inventory-service` (write) | `carbot_inventory` |
| Update vehicle | `inventory-service` (write) | `carbot_inventory` |
| Delete vehicle | `inventory-service` (write) | `carbot_inventory` |
| Search vehicles (bot) | `whatsapp-bot-service` (read) | via HTTP → inventory-service |
| List vehicles (dashboard) | `api-gateway` → `inventory-service` (read) | `carbot_inventory` |

We don't have physically separate read/write databases (that would be full CQRS with Event Sourcing), but the **responsibility is clearly separated** — only one service owns writes for a given data domain.

**The benefit**: If the WhatsApp bot gets massive traffic (1000 searches/second), we can scale `whatsapp-bot-service` horizontally (add more instances) without touching the inventory write path.

---

## Q17: How does the Super Admin vs Showroom Admin role separation work?

**Answer:**

Both roles go through the same login endpoint, but the JWT token contains a `role` field:

```json
{
  "userId": "abc",
  "tenantId": "SYSTEM",    ← Super Admin has special tenantId
  "role": "SUPER_ADMIN"
}
```

```json
{
  "userId": "xyz",
  "tenantId": "unique-cars-id",
  "role": "ADMIN"
}
```

**Frontend routing** (React):
```typescript
// App.tsx
<Route path="/super/*" element={
    <RequireRole role="SUPER_ADMIN">
        <SuperAdminLayout />
    </RequireRole>
} />
```

**Backend guards** (inventory-service):
```typescript
router.post('/admin/config/form/fields',
    authenticate,                              // verify JWT
    authorize(UserRole.SUPER_ADMIN),           // check role
    controller.addFormField.bind(controller)
);
```

**Data separation in the dashboard:**
- `SUPER_ADMIN` → sees all tenants, all vehicles, all leads globally
- `ADMIN` → query is automatically filtered to their `tenantId` via the `tenantPlugin`

---

## Q18: What would the production deployment look like?

**Answer:**

Currently we run everything locally with `pnpm run dev`. For production:

### Using Docker Compose (Small Scale):
```yaml
# docker-compose.prod.yml
services:
  nginx:              # Replaces the local tunnel (Serveo/ngrok)
    image: nginx
    ports: ["443:443"]   # SSL termination
  api-gateway:
    build: ./server/api-gateway
    environment:
      - AUTH_SERVICE_URL=http://auth-service:5001
  auth-service:
    build: ./server/services/auth-service
  inventory-service:
    build: ./server/services/inventory-service
  whatsapp-bot-service:
    build: ./server/services/whatsapp-bot-service
  redis:
    image: redis:alpine
  mongodb:
    image: mongo
```

### Using Kubernetes (Enterprise Scale):
```
Each service becomes a Kubernetes Deployment
Each service gets a Kubernetes Service (internal DNS)
Redis → managed (AWS ElastiCache or Redis Cloud)
MongoDB → managed (MongoDB Atlas)
Nginx → replaced by Kubernetes Ingress Controller
Auto-scaling based on CPU / message queue depth
```

### CI/CD Pipeline:
```
Developer pushes code → GitHub Actions runs tests
→ Docker builds service image → pushes to registry
→ Kubernetes rolling update (zero downtime)
→ Old pods gradually replaced with new ones
```

### Environment variables in production:
Never hardcode secrets. Use:
- **AWS Secrets Manager** or **HashiCorp Vault**
- **Kubernetes Secrets** (base64 encoded, access-controlled)
- Secrets injected as env vars at container startup

---

## Quick Reference: Key Files in the Bot Service

| File | Purpose |
|------|---------|
| `BotService.ts` | Core brain — state machine, routing, all bot logic |
| `WhatsAppService.ts` | Sends messages via Meta Cloud API |
| `GeminiService.ts` | NLP — extracts search params from human sentences |
| `WebhookController.ts` | Receives and parses incoming WhatsApp webhooks |
| `utils/redis.ts` | Redis connection for session storage |
| `utils/apiClient.ts` | HTTP clients for inter-service communication |
| `routes/internal.routes.ts` | Internal-only Lead CRUD endpoints |
| `models/Lead.ts` | Test drive booking data model |
| `.env` | All secrets: WhatsApp token, Gemini key, Redis URL, service URLs |

---

---

# 🔬 Part 3: Advanced Engineering Concepts — Interview Q&A

---

## Q19: How do you decide when to split a service? (Microservice Division Criteria)

**Answer:**

This is one of the most important architectural decisions. The rule of thumb is: **don't split too early**. A premature microservice is worse than a monolith.

### The 5 Criteria for Splitting:

**1. Single Responsibility / Bounded Context**
Each service should own exactly one "business domain". Ask: *"Can I describe what this service does in one sentence without using the word 'and'?"*
- ✅ `auth-service` — manages identity, login, tenants
- ✅ `inventory-service` — manages vehicle listings
- ❌ `auth-and-vehicle-service` — does too much, should be split

**2. Independent Deployability**
If changing the booking feature requires redeploying the authentication code, that's a sign they're too coupled. Each service should deploy independently.

**3. Independent Scalability**
In CarBot, the WhatsApp bot handles thousands of messages. The inventory service handles ~100 admin operations per day. They have wildly different load profiles — so they should scale separately.
```
whatsapp-bot-service: 10 replicas (high traffic)
inventory-service:     1 replica  (low traffic)
auth-service:          2 replicas (medium traffic)
```

**4. Team Ownership**
A service should be owned by one team. If two teams constantly modify the same codebase and conflict, it's a sign the service should be split by team boundary.

**5. Data Isolation**
If two features need the same database table for every operation, splitting them would be painful. Services that naturally have separate data stores are good split candidates.

### Anti-Patterns that tell you NOT to split:
- **Chatty services**: If Service A makes 10 network calls to Service B for every user request, the overhead kills performance — they should be merged
- **Shared mutable state**: If two services need to write to the same DB row, don't split
- **Too small**: A service with only 2 endpoints is probably better as a module inside another service

### CarBot's Split Rationale:
| Service | Why Separate? |
|---------|--------------|
| `auth-service` | Owns identity data, different security profile, rarely changes |
| `inventory-service` | Owns vehicle data, can use different DB engine later (Elasticsearch) |
| `whatsapp-bot-service` | Real-time, stateful, high-traffic — needs independent scaling |
| `api-gateway` | Orthogonal concern: security, routing, rate-limiting |

---

## Q20: What is Partition Rebalancing and when does it happen?

**Answer:**

This concept comes from **distributed messaging systems** like Apache Kafka. It's relevant to CarBot because we have RabbitMQ in our `docker-compose.yml` and may integrate Kafka at scale.

### What is a Partition?
In Kafka, a **topic** is like a WhatsApp group. A **partition** is a subdivision of that topic — a separate ordered log file stored on a different broker (server). Partitions allow parallel consumption.

```
Topic: "vehicle-events"
  Partition 0: [msg1, msg4, msg7] → Consumer A reads this
  Partition 1: [msg2, msg5, msg8] → Consumer B reads this
  Partition 2: [msg3, msg6, msg9] → Consumer C reads this
```

### What is Rebalancing?
When the consumer group changes (a consumer crashes, or a new one joins), Kafka must **reassign partitions** to the remaining consumers. This is a rebalance.

```
Before (3 consumers):
  Partition 0 → Consumer A
  Partition 1 → Consumer B
  Partition 2 → Consumer C

Consumer B crashes → Rebalance triggered:
  Partition 0 → Consumer A
  Partition 1 → Consumer A  ← reassigned!
  Partition 2 → Consumer C
```

### Why Rebalancing is Painful:
During rebalancing, **all consumers stop processing** (stop-the-world pause). Messages pile up. This is called **rebalance thrashing** if it happens too often.

### CarBot Relevance:
If we add Kafka for events like `VEHICLE_ADDED` or `LEAD_CREATED`, and our bot service has multiple instances (replicas), each instance is a consumer. If one crashes and comes back, a rebalance happens. We'd want to configure:
```
session.timeout.ms = 30000       // how long before consumer declared dead
max.poll.interval.ms = 300000    // how long between polls before kicked
```

---

## Q21: What are MongoDB Change Streams and how could we use them?

**Answer:**

A **Change Stream** is MongoDB's way of listening to real-time database changes — like an event listener on your collection.

### How it works:
MongoDB's replication system (the Oplog) records every write operation. Change Streams tap into this Oplog and emit events:

```typescript
// Listen to ANY change on the vehicles collection
const changeStream = Vehicle.watch();

changeStream.on('change', (event) => {
    console.log(event.operationType); // 'insert', 'update', 'delete'
    console.log(event.fullDocument);  // the new document
    console.log(event.updateDescription.updatedFields); // what changed
});
```

### Types of events:
| operationType | Trigger |
|---------------|---------|
| `insert` | New vehicle added |
| `update` | Vehicle modified (price, status, etc.) |
| `delete` | Vehicle deleted |
| `replace` | Whole document replaced |

### CarBot use cases:

**1. Real-time CRM notification:**
```typescript
// When a new lead (test drive booking) is created:
Lead.watch([{ $match: { operationType: 'insert' } }])
  .on('change', (event) => {
      // Emit a socket event to the admin's dashboard
      io.to(event.fullDocument.tenantId).emit('new_lead', event.fullDocument);
  });
// Admin dashboard updates in real time — no polling needed!
```

**2. Vehicle sold → Auto notify waitlist:**
```typescript
Vehicle.watch([{ $match: { 'updateDescription.updatedFields.status': 'sold' } }])
  .on('change', async (event) => {
      const vehicleId = event.documentKey._id;
      // Find all leads waiting for this vehicle, send WhatsApp notification
  });
```

**3. Cross-service sync (instead of direct DB access):**
Instead of the bot querying the inventory DB directly, the inventory-service could push changes into a Redis channel via Change Streams — the bot subscribes to Redis. This is a cleaner event-driven pattern.

### Requirements:
- MongoDB must be running as a **Replica Set** (not standalone)
- MongoDB Atlas always supports Change Streams
- Local: `mongod --replSet rs0`

---

## Q22: What is Backpressure in Node.js and does it affect our bot?

**Answer:**

**Backpressure** is what happens when data arrives faster than it can be processed — like water backing up in a pipe.

### The Node.js Stream Model:
Node.js has a built-in **Stream API** with a read side (producer) and write side (consumer). When the consumer is slower than the producer, data buffers in RAM. If unchecked, this causes:
- High memory usage → crashes
- Slow processing → timeouts
- Dropped messages

### Classic Backpressure Example:
```typescript
// ❌ BAD — No backpressure control
// readStream produces data faster than writeStream can write it
readStream.on('data', (chunk) => {
    writeStream.write(chunk); // Returns false if buffer is full!
});

// ✅ GOOD — Pipe handles backpressure automatically
readStream.pipe(writeStream);
// .pipe() pauses the read stream when write buffer is full
```

### Backpressure in CarBot's Context:

**1. Image Upload Pipeline:**
When a showroom uploads 10 high-res car photos, the multipart stream from the browser comes in fast. We use `multer` which uses Node.js streams internally. If Cloudinary is slow, the incoming file buffer could grow. The API Gateway uses streaming proxy (not buffering) to avoid this.

**2. WhatsApp Webhook Flood:**
If Meta sends 1000 webhook events per second (e.g., viral campaign), the bot's Express server can queue them. But if each event triggers an async DB write:
```typescript
// ❌ This can overwhelm the DB under load
app.post('/webhook', async (req, res) => {
    res.sendStatus(200); // Must respond to Meta within 5 seconds!
    await processMessage(req.body); // This could take time
});
```

The fix is to **acknowledge immediately** and process asynchronously:
```typescript
// ✅ Acknowledge fast, process in background
app.post('/webhook', (req, res) => {
    res.sendStatus(200);       // tells Meta "received, thanks"
    messageQueue.push(req.body); // add to queue for background processing
});

// Worker processes queue at a controlled rate
setInterval(() => {
    if (messageQueue.length > 0) {
        const msg = messageQueue.shift();
        processMessage(msg); // async, no blocking
    }
}, 10); // process one every 10ms = 100/second max
```

**3. Redis as a Buffer:**
Redis's List data structure (`LPUSH` / `BRPOP`) can act as a backpressure-safe job queue. Workers `BRPOP` (blocking pop) from the queue at their own pace — naturally rate-limiting processing.

---

## Q23: What is a Common Table Expression (CTE) in databases?

**Answer:**

A **CTE (Common Table Expression)** is a named temporary result set in SQL that you can reference within a single query. It's like creating a "virtual table" for just that query.

### Syntax:
```sql
WITH cte_name AS (
    SELECT ...  -- define the temporary result
)
SELECT * FROM cte_name  -- use it
```

### Why it exists:
Before CTEs, complex queries required either:
- Deeply nested subqueries (unreadable)
- Temporary tables (expensive, requires write permission)

CTEs make queries **readable, reusable within the query, and non-materialized** (usually processed inline by the query optimizer).

### CarBot's Equivalent (MongoDB Aggregation Pipeline):
CarBot uses MongoDB, not SQL — but MongoDB's `$lookup` + `$group` aggregate pipelines serve the same purpose:

```typescript
// CTE equivalent: "first get vehicle data, then join with leads"
const result = await Lead.aggregate([
    // Stage 1: Filter active leads (like CTE step 1)
    { $match: { status: { $nin: ['cancelled', 'lost'] } } },

    // Stage 2: Join with vehicles (like CTE step 2)
    { $lookup: {
        from: 'vehicles',
        localField: 'vehicleId',
        foreignField: '_id',
        as: 'vehicle'
    }},

    // Stage 3: Group by tenant (like CTE step 3)
    { $group: {
        _id: '$tenantId',
        totalLeads: { $sum: 1 },
        vehicles: { $push: '$vehicle' }
    }}
]);
```

### Recursive CTE (advanced):
CTEs can be **recursive** — they reference themselves. Useful for hierarchical data:
```sql
-- Find all employees under a manager (org tree)
WITH RECURSIVE org_tree AS (
    SELECT id, name, manager_id FROM employees WHERE id = 1  -- root
    UNION ALL
    SELECT e.id, e.name, e.manager_id
    FROM employees e
    JOIN org_tree o ON e.manager_id = o.id  -- self-join!
)
SELECT * FROM org_tree;
```

**CarBot relevance**: Our Brand → Model hierarchy could use a recursive CTE in PostgreSQL. In MongoDB, we model it as two collections: `Brand` and `Model`, related by `brandId` foreign key.

---

## Q24: Deep Redis Q&A — General + CarBot-Specific

**Answer:**

### 🔴 Redis Fundamentals

**Q: What is Redis?**
Redis (Remote Dictionary Server) is an open-source, in-memory key-value datastore. Unlike MongoDB (disk-based), all data lives in RAM. This makes it ~100x faster for reads/writes. It supports persistence via snapshots (RDB) or append-only logs (AOF).

**Q: What data structures does Redis support?**
| Structure | Redis Type | CarBot Use |
|-----------|-----------|-----------|
| Key → String | `SET/GET` | Session JSON storage |
| Ordered list | `LPUSH/RPOP` | Job queue for messages |
| Unique set | `SADD/SMEMBERS` | Online user tracking |
| Sorted set | `ZADD/ZRANGE` | Leaderboard / rate limit counters |
| Hash | `HSET/HGET` | Storing objects field-by-field |
| Pub/Sub channel | `PUBLISH/SUBSCRIBE` | Real-time event broadcasting |

**Q: What is the difference between Redis persistence modes?**
- **No persistence** (default in dev): Data is lost on restart. Fine for sessions.
- **RDB (snapshot)**: Redis writes a snapshot to disk every N seconds. Some data loss possible on crash.
- **AOF (Append Only File)**: Every write is logged. Near-zero data loss. Slower.
- **Hybrid**: Use both for best of both worlds (recommended for production).

---

### 🔴 Redis in CarBot — Practical Q&A

**Q: How are sessions stored in Redis?**
```typescript
// Key format: session:{tenantId}:{customerPhone}
const key = `session:unique-cars-id:918762763109`;

// Value: JSON string of session object
const value = JSON.stringify({
    tenantId: 'unique-cars-id',
    phone: '918762763109',
    state: 'BOOK_DATE',
    context: { lead_name: 'Zameer', current_car_id: 'abc123' },
    lastActive: new Date()
});

// TTL: 24 hours (86400 seconds) — session auto-expires
await redis.set(key, value, 'EX', 86400);
```

**Q: What happens if Redis goes down?**
Currently the bot would crash because it can't read/write sessions. The fix for production:
```typescript
// Graceful fallback: if Redis fails, fall back to in-memory Map
let session;
try {
    const data = await redis.get(key);
    session = data ? JSON.parse(data) : createNewSession();
} catch (err) {
    logger.error('Redis unavailable, using in-memory fallback');
    session = inMemoryFallback.get(key) || createNewSession();
}
```

**Q: How would you cache Tenant data in Redis to avoid repeated DB queries?**
Right now, the bot calls the auth-service on every incoming message to fetch the tenant. We can cache it:
```typescript
async function getTenant(phoneNumberId: string) {
    const cacheKey = `tenant:phone:${phoneNumberId}`;

    // 1. Check Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 2. Cache miss — fetch from auth-service
    const res = await authServiceClient.get(`/internal/tenants/whatsapp/${phoneNumberId}`);
    const tenant = res.data?.data;

    // 3. Store in Redis for 10 minutes
    await redis.set(cacheKey, JSON.stringify(tenant), 'EX', 600);

    return tenant;
}
// Result: first message = 1 DB call, next 1000 messages = 0 DB calls
```

**Q: How would you use Redis for rate limiting the bot?**
```typescript
// Allow max 5 messages per customer per 10 seconds
async function isRateLimited(phone: string): Promise<boolean> {
    const key = `rate:${phone}`;
    const count = await redis.incr(key);   // increment counter

    if (count === 1) {
        await redis.expire(key, 10);        // set 10s window on first hit
    }

    return count > 5; // return true if rate limited
}
```

**Q: How would you use Redis Pub/Sub for real-time CRM notifications?**
```typescript
// Publisher: bot-service, when a new lead comes in
await redis.publish('new_lead', JSON.stringify({
    tenantId: 'unique-cars-id',
    customerName: 'Zameer',
    vehicle: 'Hyundai Creta'
}));

// Subscriber: a WebSocket server pushes it to the admin dashboard
redis.subscribe('new_lead', (message) => {
    const lead = JSON.parse(message);
    io.to(lead.tenantId).emit('lead_arrived', lead);
    // Admin's browser shows a toast notification in real time!
});
```

---

### 🔴 Redis Interview Questions (General)

**Q: What is the difference between `DEL` and `UNLINK`?**
- `DEL` is synchronous — blocks Redis while deleting (bad for large keys)
- `UNLINK` is async — marks for deletion and frees memory in background (always prefer this)

**Q: What is a Redis Pipeline and why use it?**
```typescript
// ❌ 3 separate round trips to Redis server
await redis.set('a', '1');
await redis.set('b', '2');
await redis.set('c', '3');

// ✅ 1 round trip — pipeline batches all commands
const pipeline = redis.pipeline();
pipeline.set('a', '1');
pipeline.set('b', '2');
pipeline.set('c', '3');
await pipeline.exec();
// Up to 10x faster under load
```

**Q: What is the difference between Redis `EXPIRE` and `EXPIREAT`?**
- `EXPIRE key 3600` — expire in 3600 seconds from now
- `EXPIREAT key 1712000000` — expire at this Unix timestamp (absolute time)

**Q: What is Redis Sorted Set and when would you use it?**
```typescript
// Add items with a score (rank)
await redis.zadd('leaderboard', 1500, 'Zameer');
await redis.zadd('leaderboard', 2300, 'Ahmed');
await redis.zadd('leaderboard', 800,  'Priya');

// Get top 3 in descending order
const top3 = await redis.zrevrange('leaderboard', 0, 2, 'WITHSCORES');
// ["Ahmed", "2300", "Zameer", "1500", "Priya", "800"]
```
Use cases: Leaderboards, rate limiting with sliding windows, priority queues.

**Q: How does Redis handle concurrency? Is it thread-safe?**
Redis is **single-threaded** for command execution. This means every command runs atomically — no two commands execute simultaneously. This is why it has no race conditions for simple operations.

For complex atomic operations across multiple commands, use **Lua scripts** or **Redis Transactions** (`MULTI/EXEC`):
```typescript
// Atomic check-and-set (no race condition)
await redis.eval(`
    local current = redis.call('GET', KEYS[1])
    if current == ARGV[1] then
        redis.call('SET', KEYS[1], ARGV[2])
        return 1
    end
    return 0
`, 1, 'mykey', 'expected_value', 'new_value');
```

**Q: What is Redis Cluster vs Redis Sentinel?**
| Feature | Redis Sentinel | Redis Cluster |
|---------|---------------|---------------|
| Purpose | High availability (HA) | Horizontal sharding |
| Data | All nodes have full data | Data split across nodes |
| Nodes | 1 master + N replicas | Multiple masters + replicas |
| Use when | You need failover | Data > single node RAM |
| Complexity | Medium | High |

For CarBot production: **Redis Sentinel** is sufficient (session data is small, HA is the concern).
