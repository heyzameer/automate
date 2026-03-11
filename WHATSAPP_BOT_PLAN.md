# 🚗 CarBot AI — WhatsApp Chatbot SaaS Platform
## Complete Implementation Plan & Developer Reference

> **Stack:** MERN (MongoDB, Express, React, Node.js) + WhatsApp Cloud API + Gemini AI + Fuse.js
> **Architecture:** SaaS / Multi-Tenant from Day 1
> **Date:** March 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User Roles & Portals](#2-user-roles--portals)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [MongoDB Schemas — SaaS Native](#5-mongodb-schemas--saas-native)
6. [Conversation State Management](#6-conversation-state-management)
7. [Chatbot Flow Design](#7-chatbot-flow-design)
8. [NLP & Fuzzy Search](#8-nlp--fuzzy-search)
9. [WhatsApp Cloud API Integration](#9-whatsapp-cloud-api-integration)
10. [Super Admin Panel Features](#10-super-admin-panel-features)
11. [Showroom Admin Panel Features](#11-showroom-admin-panel-features)
12. [Multi-Tenant Data Isolation](#12-multi-tenant-data-isolation)
13. [SaaS Pricing Plans](#13-saas-pricing-plans)
14. [Implementation Phases](#14-implementation-phases)
15. [Environment Variables](#15-environment-variables)
16. [API Routes Reference](#16-api-routes-reference)
17. [Example Conversations](#17-example-conversations)
18. [Meta Developer Setup](#18-meta-developer-setup)
19. [Deployment Guide](#19-deployment-guide)

---

## 1. Project Overview

**CarBot AI** is a SaaS platform that provides AI-powered WhatsApp chatbots to car showrooms. Any car dealership can sign up, connect their own WhatsApp number, upload their inventory, and get a fully branded chatbot — all running on one shared backend.

### Three Core Components:

| Component | Who Uses It | URL |
|-----------|------------|-----|
| **Chatbot** | End customers (car buyers via WhatsApp) | WhatsApp number per showroom |
| **Showroom Admin Panel** | Showroom owners / staff | `panel.carbotai.in` |
| **Super Admin Panel** | Platform owner (you) | `admin.carbotai.in` |

### What customers can do via WhatsApp bot:
- Search cars by **budget, brand, fuel type, model year**
- Handle **spelling mistakes** (creata → Creta)
- Retrieve full car details + images using a **stock code**
- **Sort results** by price or latest model
- **Book showroom appointments** directly from WhatsApp
- Receive **natural language replies** powered by Gemini AI

---

## 2. User Roles & Portals.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CARBOT AI PLATFORM                           │
│                                                                  │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │  🏪 SHOWROOM ADMIN  │    │  👑 SUPER ADMIN (YOU)        │   │
│  │  panel.carbotai.in  │    │  admin.carbotai.in           │   │
│  │                     │    │                              │   │
│  │  Each showroom owner│    │  Platform owner (you) sees   │   │
│  │  manages their OWN  │    │  ALL showrooms, controls     │   │
│  │  data only          │    │  access, billing & WA config │   │
│  └─────────────────────┘    └──────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🤖 WHATSAPP CHATBOT                                    │   │
│  │  One per showroom — each on their own WA number         │   │
│  │  Branded with showroom name, scoped to their inventory  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Role Breakdown:

| Role | Panel | Capabilities |
|------|-------|-------------|
| **Super Admin** | `admin.carbotai.in` | Manage all tenants, activate/deactivate access, configure WhatsApp per showroom, form builder, platform analytics |
| **Showroom Owner** | `panel.carbotai.in` | Manage own cars, leads, appointments, view subscription status |
| **Showroom Staff** | `panel.carbotai.in` | Same as owner but limited by role (manager/staff) |
| **End Customer** | WhatsApp | Chat with bot to search cars & book appointments |

---

## 3. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Showroom Admin Frontend** | React + Vite | Fast, modern dashboard |
| **Super Admin Frontend** | React + Vite | Separate app, separate auth |
| **Backend API** | Node.js + Express | REST API + webhook handler |
| **Database** | MongoDB + Mongoose | Flexible multi-tenant schema |
| **AI / NLP** | Google Gemini API | Parse natural language car queries |
| **Fuzzy Search** | Fuse.js | Handle spelling mistakes |
| **WhatsApp** | Meta WhatsApp Cloud API | Send/receive messages & images |
| **Image Storage** | Cloudinary | CDN image hosting, per-tenant folders |
| **Email** | Nodemailer / Resend | Onboarding + appointment notifications |
| **Auth** | JWT + bcrypt | Separate JWTs for tenant users vs super admin |
| **Session Store** | MongoDB | Maintain per-tenant conversation context |
| **Encryption** | crypto-js | Encrypt WhatsApp tokens stored in DB |
| **Cron Jobs** | node-cron | Plan expiry checks, session cleanup |

---

## 4. Project Structure

```
carbotai/
│
├── server/                               # Node.js + Express backend
│   ├── config/
│   │   ├── db.js                         # MongoDB connection
│   │   ├── cloudinary.js                 # Cloudinary SDK setup
│   │   └── env.js                        # dotenv loader
│   │
│   ├── models/                           # ALL models are SaaS-native
│   │   ├── Tenant.model.js               # ⭐ Each showroom = 1 tenant
│   │   ├── TenantUser.model.js           # ⭐ Showroom staff logins
│   │   ├── SuperAdmin.model.js           # ⭐ Platform owner login
│   │   ├── Car.model.js                  # + tenant_id field
│   │   ├── Lead.model.js                 # + tenant_id field
│   │   ├── Appointment.model.js          # + tenant_id field
│   │   ├── Session.model.js              # + tenant_id field (compound unique)
│   │   ├── FormField.model.js            # ⭐ Car form builder (super admin)
│   │   └── AccessLog.model.js            # ⭐ Payment / access history
│   │
│   ├── controllers/
│   │   ├── webhook.controller.js         # Routes by phone_number_id → tenant
│   │   ├── car.controller.js             # CRUD for cars (tenant-scoped)
│   │   ├── lead.controller.js            # Lead management (tenant-scoped)
│   │   ├── appointment.controller.js     # Appointments (tenant-scoped)
│   │   ├── auth.controller.js            # Tenant user login/logout
│   │   ├── tenant.controller.js          # ⭐ Showroom settings
│   │   ├── superadmin.controller.js      # ⭐ Platform-level operations
│   │   └── formfield.controller.js       # ⭐ Car form builder
│   │
│   ├── services/
│   │   ├── whatsapp.service.js           # Send text/image/menu (tenant token)
│   │   ├── nlp.service.js                # Gemini AI query parser
│   │   ├── fuzzy.service.js              # Fuse.js fuzzy matching
│   │   ├── car.service.js                # Car DB queries (tenant-scoped)
│   │   ├── session.service.js            # Session read/write/reset
│   │   ├── lead.service.js               # Auto-save customer leads
│   │   └── email.service.js              # Nodemailer alerts
│   │
│   ├── routes/
│   │   ├── webhook.routes.js             # GET+POST /webhook
│   │   ├── car.routes.js                 # /api/cars (tenant auth required)
│   │   ├── lead.routes.js                # /api/leads
│   │   ├── appointment.routes.js         # /api/appointments
│   │   ├── auth.routes.js                # /api/auth (tenant login)
│   │   ├── tenant.routes.js              # /api/tenant (showroom settings)
│   │   ├── superadmin.routes.js          # /api/super/* (super admin only)
│   │   └── formfield.routes.js           # /api/form-fields
│   │
│   ├── middleware/
│   │   ├── tenantAuth.middleware.js      # JWT verify + attach tenant
│   │   ├── superAuth.middleware.js       # Super admin JWT verify
│   │   ├── planLimit.middleware.js       # Check car/lead plan limits
│   │   └── upload.middleware.js          # Multer + Cloudinary
│   │
│   ├── utils/
│   │   ├── botMessages.js               # Message templates (dynamic per tenant)
│   │   ├── stockCodeDetector.js         # Regex: detect "car01"
│   │   ├── dateHelper.js                # Tomorrow/DayAfter utility
│   │   └── encrypt.js                   # AES encrypt/decrypt WA tokens
│   │
│   └── index.js                         # Express entry point
│
├── client/                              # 🏪 Showroom Admin Panel (React + Vite)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx            # Stats: leads, cars, appointments
│       │   ├── Cars.jsx                 # Car inventory management
│       │   ├── Leads.jsx                # Lead tracking table
│       │   ├── Appointments.jsx         # Appointment list + confirm
│       │   ├── Settings.jsx             # Showroom profile, bot settings
│       │   ├── Subscription.jsx         # Plan status, renewal info
│       │   └── Login.jsx                # Showroom staff login
│       │
│       └── components/
│           ├── DynamicCarForm.jsx       # Renders fields from FormField API
│           ├── CarCard.jsx
│           ├── LeadTable.jsx
│           ├── AppointmentTable.jsx
│           └── Sidebar.jsx
│
├── superadmin/                          # 👑 Super Admin Panel (React + Vite)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx            # Platform-wide stats
│       │   ├── Tenants.jsx              # All showrooms list
│       │   ├── TenantDetail.jsx         # Single showroom deep-dive
│       │   ├── AccessControl.jsx        # Toggle access, set expiry, plan
│       │   ├── WhatsAppConfig.jsx       # Per-showroom WA credentials
│       │   ├── FormBuilder.jsx          # Dynamic car form field editor
│       │   └── Login.jsx                # Super admin login
│       │
│       └── components/
│           ├── TenantTable.jsx
│           ├── AccessManager.jsx
│           └── Sidebar.jsx
│
├── .env
├── WHATSAPP_BOT_PLAN.md
└── package.json
```

---

## 5. MongoDB Schemas — SaaS Native

> **Rule #1:** Every model except `Tenant`, `SuperAdmin`, and `FormField` MUST have `tenant_id`.

### 5.1 Tenant Schema (Each Showroom = 1 Tenant)
```js
// models/Tenant.model.js
const TenantSchema = new mongoose.Schema({
  // Identity
  showroom_name:    { type: String, required: true },   // "Haripriya Cars"
  slug:             { type: String, unique: true },      // "haripriya-cars"
  owner_name:       { type: String },
  owner_email:      { type: String, required: true, unique: true },
  owner_phone:      { type: String },

  // WhatsApp Config (set by Super Admin only)
  whatsapp_phone_number_id:  { type: String, unique: true, sparse: true },
  whatsapp_access_token:     { type: String },           // AES encrypted
  whatsapp_display_number:   { type: String },           // "+91 98765 43210"

  // Showroom Info (shown in bot messages)
  showroom_address:  { type: String },
  showroom_city:     { type: String },
  showroom_logo_url: { type: String },                   // Cloudinary URL
  showroom_timings:  { type: String, default: '10 AM – 7 PM' },
  showroom_contact:  { type: String },

  // Bot Customization
  bot_name:          { type: String, default: 'CarBot' },
  welcome_message:   { type: String },                   // Custom greeting

  // Access Control (managed by Super Admin)
  is_access_active:   { type: Boolean, default: false }, // You flip this ON after payment
  access_valid_until: { type: Date },                    // Bot auto-deactivates after this
  plan:               { type: String, enum: ['trial','basic','pro','enterprise'], default: 'trial' },
  plan_status:        { type: String, enum: ['active','expired','suspended'], default: 'active' },
  trial_ends_at:      { type: Date },
  payment_notes:      { type: String },                  // "₹999 via UPI, 26-Feb-2026"

  // Plan Limits
  max_cars:             { type: Number, default: 20 },
  max_leads_per_month:  { type: Number, default: 100 },
  max_staff_users:      { type: Number, default: 1 },

  // Account State
  is_verified:       { type: Boolean, default: false },  // Email verified
  onboarding_step:   { type: Number, default: 1 },       // 1=register, 2=WA, 3=inventory, 4=done

}, { timestamps: true });
```

### 5.2 TenantUser Schema (Showroom Staff)
```js
// models/TenantUser.model.js
const TenantUserSchema = new mongoose.Schema({
  tenant_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name:       { type: String },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },          // bcrypt hashed
  role:       { type: String, enum: ['owner','manager','staff'], default: 'owner' },
  is_active:  { type: Boolean, default: true },
}, { timestamps: true });
```

### 5.3 SuperAdmin Schema
```js
// models/SuperAdmin.model.js
const SuperAdminSchema = new mongoose.Schema({
  name:       { type: String },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },          // bcrypt hashed
}, { timestamps: true });
// Only 1 record needed. Protected by separate SUPER_JWT_SECRET.
```

### 5.4 Car Schema
```js
// models/Car.model.js
const CarSchema = new mongoose.Schema({
  tenant_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  stock_code:    { type: String, required: true },               // "car01" — unique per tenant
  brand:         { type: String, required: true },
  model:         { type: String, required: true },
  year:          { type: Number, required: true },
  price:         { type: Number, required: true },
  fuel_type:     { type: String, enum: ['Petrol','Diesel','CNG','Electric','Hybrid'] },
  transmission:  { type: String, enum: ['Manual','Automatic'] },
  owner:         { type: String },
  km_driven:     { type: Number },
  color:         { type: String },
  description:   { type: String },
  images:        [{ type: String }],                             // Cloudinary URLs
  is_available:  { type: Boolean, default: true },
  tags:          [{ type: String }],
}, { timestamps: true });

CarSchema.index({ tenant_id: 1, stock_code: 1 }, { unique: true });
```

### 5.5 Session Schema (Chatbot conversation state)
```js
// models/Session.model.js
const SessionSchema = new mongoose.Schema({
  tenant_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  phone:        { type: String, required: true },          // Customer WhatsApp number
  state:        {
    type: String,
    enum: ['IDLE','MENU','SEARCH_BUDGET','SEARCH_BRAND','SEARCH_FUEL',
           'VIEW_RESULTS','CAR_DETAIL','BOOK_DATE','BOOK_CUSTOM_DATE',
           'BOOK_CONFIRM','AWAITING_NAME'],
    default: 'IDLE'
  },
  context: {
    search_filters: {
      brand: String, model: String, max_price: Number,
      min_price: Number, fuel_type: String, transmission: String,
      year: Number, sort_by: String,
    },
    current_car_id:   String,
    booking_details:  { date: String, car_interest: String },
    results_page:     Number,
    customer_name:    String,
  },
  last_active:  { type: Date, default: Date.now },
});
// One session per customer per tenant
SessionSchema.index({ tenant_id: 1, phone: 1 }, { unique: true });
```

### 5.6 Lead Schema
```js
// models/Lead.model.js
const LeadSchema = new mongoose.Schema({
  tenant_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  phone:      { type: String, required: true },
  name:       { type: String, default: 'Unknown' },
  interest:   { type: String },
  car_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  stock_code: { type: String },
  status:     { type: String, enum: ['new','contacted','converted','lost'], default: 'new' },
  source:     { type: String, default: 'whatsapp' },
  notes:      { type: String },
}, { timestamps: true });
```

### 5.7 Appointment Schema
```js
// models/Appointment.model.js
const AppointmentSchema = new mongoose.Schema({
  tenant_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  phone:           { type: String, required: true },
  name:            { type: String },
  date:            { type: Date, required: true },
  time_slot:       { type: String, default: '11:00 AM' },
  status:          { type: String, enum: ['pending','confirmed','cancelled'], default: 'pending' },
  car_of_interest: { type: String },
  car_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  notes:           { type: String },
  confirmed_by:    { type: String },
}, { timestamps: true });
```

### 5.8 FormField Schema (Car form builder — global, set by Super Admin)
```js
// models/FormField.model.js
const FormFieldSchema = new mongoose.Schema({
  field_key:   { type: String, required: true, unique: true },  // "km_driven"
  label:       { type: String, required: true },                // "KM Driven"
  type:        { type: String, enum: ['text','number','dropdown','checkbox','date','image'] },
  options:     [String],                                        // For dropdowns
  is_required: { type: Boolean, default: false },
  is_visible:  { type: Boolean, default: true },
  sort_order:  { type: Number },
  placeholder: { type: String },
});
// All showrooms share the same dynamic form fields defined here.
```

### 5.9 AccessLog Schema
```js
// models/AccessLog.model.js
const AccessLogSchema = new mongoose.Schema({
  tenant_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  action:      { type: String },   // "access_activated", "plan_changed", "access_expired"
  plan:        { type: String },
  valid_until: { type: Date },
  notes:       { type: String },   // "₹999 via UPI ref TXN123"
  done_by:     { type: String },   // Super admin name
}, { timestamps: true });
```

---

## 6. Conversation State Management

### 6.1 How It Works

Every incoming WhatsApp message goes through this flow:

```
Incoming Message:
  1. Read phone_number_id → find Tenant in DB
  2. Check tenant.is_access_active — if false, send "subscription expired" message
  3. Get customer Session by { tenant_id, phone }
  4. Read their current STATE
  5. Route message to the correct handler based on STATE
  6. Process (NLP / detect input type)
  7. Update STATE and CONTEXT in MongoDB
  8. Send reply using THIS tenant's WA token + phone_number_id
```

### 6.2 Session Service (Multi-Tenant Aware)
```js
// services/session.service.js

async function getSession(tenantId, phone) {
  const EXPIRY_HOURS = 24;
  let session = await Session.findOne({ tenant_id: tenantId, phone });

  if (!session) {
    session = await Session.create({ tenant_id: tenantId, phone, state: 'IDLE' });
  } else {
    const isExpired = (Date.now() - session.last_active) > (EXPIRY_HOURS * 3600 * 1000);
    if (isExpired) {
      session.state = 'IDLE';
      session.context = {};
    }
  }
  session.last_active = new Date();
  await session.save();
  return session;
}

async function setState(tenantId, phone, newState, contextUpdates = {}) {
  await Session.findOneAndUpdate(
    { tenant_id: tenantId, phone },
    { state: newState, context: contextUpdates, last_active: new Date() },
    { upsert: true }
  );
}
```

### 6.3 State Transition Table

| Current State | User Input | Next State | Action |
|--------------|-----------|-----------|--------|
| `IDLE` | Any message | `MENU` | Send welcome message + menu |
| `MENU` | "1" or "budget" | `SEARCH_BUDGET` | Ask for budget |
| `MENU` | "2" or "brand" | `SEARCH_BRAND` | Ask for brand |
| `MENU` | "3" or "fuel" | `SEARCH_FUEL` | Ask fuel type |
| `MENU` | "4" or "latest" | `VIEW_RESULTS` | Query latest cars |
| `MENU` | "5" or "book" | `BOOK_DATE` | Start booking flow |
| `MENU` | Stock code | `CAR_DETAIL` | Direct car lookup |
| `MENU` | Natural language | `VIEW_RESULTS` | NLP parse + search |
| `SEARCH_BUDGET` | Number/text | `VIEW_RESULTS` | Parse price, query DB |
| `SEARCH_BRAND` | Text | `VIEW_RESULTS` | Fuzzy match, query DB |
| `VIEW_RESULTS` | "YES" | `BOOK_DATE` | Start booking |
| `VIEW_RESULTS` | Stock code | `CAR_DETAIL` | Show specific car |
| `CAR_DETAIL` | "YES" | `BOOK_DATE` | Book test drive |
| `BOOK_DATE` | "1" | `BOOK_CONFIRM` | Date = tomorrow |
| `BOOK_DATE` | "3" | `BOOK_CUSTOM_DATE` | Ask custom date |
| `BOOK_CONFIRM` | "YES" | `IDLE` | Save appointment |
| Any State | "hi"/"menu"/"start" | `MENU` | Reset + show menu |

---

## 7. Chatbot Flow Design

### 7.1 Welcome Message (Dynamic per Showroom)

```
🙏 Welcome to *{tenant.showroom_name}*!

How can I help you today?

1️⃣ Search by Budget
2️⃣ Search by Brand
3️⃣ Search by Fuel Type
4️⃣ Latest Arrivals
5️⃣ Book Showroom Appointment
6️⃣ Search by Stock Code

💬 Or just type what you're looking for!
Example: "Swift under 6 lakh" or "Diesel SUV auto"

Type MENU anytime to return here.
```

### 7.2 Natural Language Search Result

```
🔍 Found 2 cars for: *Maruti Swift under ₹6 Lakh*

━━━━━━━━━━━━━━━━━
🚗 *Maruti Swift VXI 2019*
💰 ₹5,50,000
⛽ Petrol | ⚙️ Manual | 📍 1st Owner | 42,000 km
🏷️ Stock Code: *car07*
━━━━━━━━━━━━━━━━━

Send the *Stock Code* to see full details + photos
Reply *YES* to book a test drive | Type *MENU* to go back
```

### 7.3 Appointment Booking Flow

```
Step 1 → User says "YES" after viewing a car
Bot: Choose your preferred visit date:
     1️⃣ Tomorrow (27 Feb)  2️⃣ Day After  3️⃣ Custom Date

Step 2 → User replies "1"
Bot: May I know your good name? 🙏

Step 3 → User says "Rahul Sharma"
Bot: ✅ Appointment Booked!
     👤 Name: Rahul Sharma | 📅 27 Feb 2026 | ⏰ 11 AM
     📍 {tenant.showroom_address}
     📞 {tenant.showroom_contact}
     Our team will call to confirm. Thank you! 🚗🙏

[Email alert sent to showroom owner]
[Appointment saved in DB with tenant_id]
[Lead auto-created/updated]
```

### 7.4 Subscription Expired Response (Bot)

```
⚠️ This bot is currently inactive.
Please contact the showroom directly.
📞 {tenant.showroom_contact}
```

---

## 8. NLP & Fuzzy Search

### 8.1 Gemini AI — Query Parser
```js
// services/nlp.service.js
async function parseCarQuery(userMessage) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `
You are a car search assistant. Extract search parameters from the user's message.
User message: "${userMessage}"

Return ONLY valid JSON:
{
  "brand": string or null,
  "model": string or null,
  "max_price": number or null,
  "min_price": number or null,
  "fuel_type": "Petrol"|"Diesel"|"CNG"|"Electric" or null,
  "transmission": "Manual"|"Automatic" or null,
  "year": number or null,
  "sort_by": "price_asc"|"price_desc"|"year_desc" or null,
  "intent": "search"|"book"|"greeting"|"sort"|"specific"
}`;
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text().trim().replace(/```json|```/g, ''));
}
```

### 8.2 Fuse.js — Fuzzy Brand/Model Matching
```js
// services/fuzzy.service.js
async function fuzzyMatchCar(rawText, tenantId) {
  // Always scoped to this tenant's inventory
  const cars = await Car.find({ tenant_id: tenantId }, 'brand model fuel_type');
  const items = cars.map(c => ({
    brand: c.brand, model: c.model, fuel: c.fuel_type,
    combined: `${c.brand} ${c.model} ${c.fuel_type}`
  }));
  const fuse = new Fuse(items, { keys: ['combined','brand','model'], threshold: 0.4, includeScore: true });
  const results = fuse.search(rawText);
  if (!results.length) return null;
  return { ...results[0].item, confidence: 1 - results[0].score };
}
// Example: fuzzyMatchCar("creata disel", tenantId)
// → { brand: "Hyundai", model: "Creta", fuel: "Diesel", confidence: 0.82 }
```

---

## 9. WhatsApp Cloud API Integration

### 9.1 One Webhook, Many Numbers

All registered phone numbers send to ONE webhook. The `phone_number_id` in the payload identifies which showroom.

```
Meta App (Yours)
  └── WhatsApp Product
        ├── +91-9876543210 (Haripriya Cars)   phone_number_id: 111
        ├── +91-8765432109 (Sharma Motors)    phone_number_id: 222
        └── +91-7654321098 (Ravi Auto Works)  phone_number_id: 333
              │
              ALL → POST https://api.carbotai.in/webhook
```

### 9.2 Webhook Handler (Multi-Tenant Router)
```js
// controllers/webhook.controller.js
async function handleWebhook(req, res) {
  res.status(200).send('OK'); // Always respond immediately to WhatsApp

  const value         = req.body.entry?.[0]?.changes?.[0]?.value;
  const phoneNumberId = value?.metadata?.phone_number_id; // ← identifies showroom
  const messages      = value?.messages;
  if (!messages?.length) return;

  // Route to correct tenant
  const tenant = await Tenant.findOne({
    whatsapp_phone_number_id: phoneNumberId,
    is_access_active: true
  });

  if (!tenant) {
    // Unknown number — optionally send "bot not active" reply
    return;
  }

  const phone    = messages[0].from;
  const msgType  = messages[0].type;
  let userText   = '';
  if (msgType === 'text')        userText = messages[0].text.body;
  if (msgType === 'interactive') userText = messages[0].interactive.list_reply?.id
                                          || messages[0].interactive.button_reply?.id;

  await processMessage(phone, userText.trim(), tenant);
}
```

### 9.3 WhatsApp Service (Per-Tenant Token)
```js
// services/whatsapp.service.js
async function sendText(to, message, tenant) {
  const token       = decrypt(tenant.whatsapp_access_token);
  const phoneNumId  = tenant.whatsapp_phone_number_id;
  const url = `https://graph.facebook.com/v19.0/${phoneNumId}/messages`;
  await axios.post(url,
    { messaging_product: 'whatsapp', to, type: 'text', text: { body: message } },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

async function sendImage(to, imageUrl, caption, tenant) {
  // same pattern — uses tenant's own token + phone_number_id
}
```

### 9.4 Webhook Verification (GET)
```js
router.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});
```

---

## 10. Super Admin Panel Features

**URL:** `admin.carbotai.in` | **Auth:** Separate JWT (`SUPER_JWT_SECRET`)

### 10.1 Dashboard
- Total active showrooms
- Total bots live today
- Total leads generated platform-wide this month
- Total messages processed
- Webhook error count

### 10.2 Tenant Management
- List ALL registered showrooms with: name, city, plan, access status, expiry, car count, lead count
- Search & filter by plan, city, status
- Click into any showroom → view their cars, leads, appointments, sessions (for support)

### 10.3 Access Control (Manual Payment Model)
```
For each showroom you can:
  ✅ Toggle "is_access_active" ON/OFF   → controls whether bot works
  ✅ Set "access_valid_until" date       → auto-deactivates on expiry
  ✅ Assign Plan (basic/pro/enterprise)  → sets car/lead/staff limits
  ✅ Add payment notes                   → "₹999 via UPI ref TXN123"
  ✅ View full access history log
```

**Access check on every API call:**
```js
// middleware/tenantAuth.middleware.js
if (!tenant.is_access_active) {
  return res.status(403).json({ error: 'Subscription expired. Contact support.' });
}
if (tenant.access_valid_until && tenant.access_valid_until < new Date()) {
  await Tenant.findByIdAndUpdate(tenant._id, { is_access_active: false });
  return res.status(403).json({ error: 'Access expired. Please renew.' });
}
```

### 10.4 WhatsApp Config (Per Showroom — Super Admin Only)
- View/edit each showroom's WhatsApp credentials:
  - Phone Number ID (from Meta Developer Portal)
  - Access Token (encrypted, shown masked)
  - Display Number
- **Test Connection** button → validate token via WhatsApp API
- Showroom owners CANNOT see or edit these credentials

### 10.5 Car Form Builder
- Define which fields appear on the "Add Car" form for ALL showrooms
- Add / Remove / Reorder fields (drag & drop)
- Field types: Text, Number, Dropdown, Checkbox, Date, Image
- Mark fields as Required / Optional
- Showrooms dynamically render their car form from this config

```
Default fields:
  Stock Code (required), Brand (required), Model (required),
  Year (required), Price (required), Fuel Type (dropdown),
  Transmission (dropdown), KM Driven, Owner Number,
  Color, Description, Images, RC Available (checkbox)
```

### 10.6 Platform Analytics
- Active tenants over time
- New signups per month
- Revenue tracking (manual entry)
- Message volume per tenant

### 10.7 Broadcast Email
- Send announcement to all showroom owners, or filter by plan

---

## 11. Showroom Admin Panel Features

**URL:** `panel.carbotai.in` | **Auth:** Tenant JWT (`TENANT_JWT_SECRET`)
**Data scope:** ALWAYS filtered by `tenant_id` from JWT

### 11.1 Dashboard
- Total cars in inventory
- New leads today / this week
- Pending appointments
- Recent activity feed

### 11.2 Car Inventory Management
- **Add Car:** Dynamic form (fields loaded from FormField API — defined by Super Admin)
- **Image Upload:** Multiple images per car → Cloudinary (per-tenant folder)
- **Edit / Delete Car:** Full CRUD
- **Stock Code:** Unique per tenant (e.g., car01, car02)
- **Mark as Sold/Unavailable**

### 11.3 Lead Tracking
- Table: phone, name, car interest, date, status, notes
- Update status: `New → Contacted → Converted → Lost`
- Filter by status, date range

### 11.4 Appointment Management
- List of all upcoming appointments
- Confirm / Cancel → sends WhatsApp message to customer on confirm
- View customer phone + car of interest

### 11.5 Settings (What Showroom Can Edit)
- Showroom name, address, city, timings, contact number
- Welcome message (custom bot greeting)
- Owner email, phone
- Showroom logo (Cloudinary upload)
- **CANNOT edit:** WhatsApp phone number ID, access token (Super Admin only)

### 11.6 Subscription Page (Read-Only)
```
Shows:
  - Current plan: Basic / Pro / Enterprise
  - Access status: ✅ Active / ❌ Expired
  - Valid until: [date]
  - Payment instructions (UPI ID, contact)
  - "Renew / Contact" button → opens WhatsApp to your number
```

### 11.7 Staff Management (per plan limits)
- Owner can add staff users (manager/staff roles)
- Limited by `max_staff_users` on their plan

---

## 12. Multi-Tenant Data Isolation

### The Golden Rule
**Every DB query MUST include `tenant_id`. No exceptions.**

```js
// ✅ CORRECT
const cars  = await Car.find({ tenant_id: req.tenant._id, is_available: true });
const leads = await Lead.find({ tenant_id: req.tenant._id, status: 'new' });

// ❌ WRONG — DATA LEAK
const cars = await Car.find({ is_available: true }); // NEVER do this
```

### Tenant Middleware
```js
// middleware/tenantAuth.middleware.js
async function attachTenant(req, res, next) {
  const token   = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.TENANT_JWT_SECRET);
  const user    = await TenantUser.findById(decoded.userId).populate('tenant_id');
  const tenant  = user?.tenant_id;

  if (!tenant || !tenant.is_access_active) {
    return res.status(403).json({ error: 'Access denied or subscription expired.' });
  }

  req.tenant    = tenant;
  req.tenantUser = user;
  next();
}
```

### Plan Limit Middleware
```js
// middleware/planLimit.middleware.js
async function checkCarLimit(req, res, next) {
  const count = await Car.countDocuments({ tenant_id: req.tenant._id });
  if (count >= req.tenant.max_cars) {
    return res.status(403).json({
      error: `Car limit reached for ${req.tenant.plan} plan. Contact support to upgrade.`
    });
  }
  next();
}
```

---

## 13. SaaS Pricing Plans

| Feature | 🆓 Trial (14 days) | 💼 Basic ₹999/mo | 🚀 Pro ₹2,499/mo | 🏢 Enterprise ₹5,999/mo |
|---------|:------------------:|:----------------:|:----------------:|:-----------------------:|
| Cars in inventory | 20 | 50 | 200 | Unlimited |
| Leads / month | 100 | 500 | 2,000 | Unlimited |
| Staff logins | 1 | 2 | 5 | Unlimited |
| Appointments | ✅ | ✅ | ✅ | ✅ |
| Image sending | ✅ | ✅ | ✅ | ✅ |
| NLP / AI search | ✅ | ✅ | ✅ | ✅ |
| Custom welcome msg | ❌ | ✅ | ✅ | ✅ |
| Email alerts | ❌ | ✅ | ✅ | ✅ |
| Analytics | Basic | Basic | Advanced | Full |
| Priority Support | ❌ | ❌ | ✅ | ✅ Dedicated |

> **Payment is manual** — showroom pays (UPI/cash/transfer), you activate in Super Admin. No payment gateway needed initially.

---

## 14. Implementation Phases

### ✅ Phase 1 — SaaS Foundation (Week 1, Days 1–3)
- [ ] Initialize Node.js + Express project
- [ ] Connect MongoDB Atlas
- [ ] Create ALL Mongoose models with `tenant_id` from day 1:
  - `Tenant`, `TenantUser`, `SuperAdmin`, `Car`, `Lead`, `Appointment`, `Session`, `FormField`, `AccessLog`
- [ ] Build `tenantAuth.middleware.js` + `superAuth.middleware.js`
- [ ] Build `planLimit.middleware.js`
- [ ] Build `/api/super/auth` — Super Admin login (returns super JWT)
- [ ] Seed: 1 SuperAdmin, 1 test Tenant, 1 TenantUser
- [ ] Test with Postman — verify tenant isolation

### ✅ Phase 2 — Super Admin Panel (Week 1, Days 4–5)
- [ ] Initialize React + Vite for `superadmin/` app
- [ ] Super Admin login page (separate JWT)
- [ ] Tenants list page (table: name, plan, access status, expiry)
- [ ] Access Control page — toggle `is_access_active`, set expiry, plan, notes
- [ ] FormField builder page — add/remove/reorder car form fields
- [ ] Basic platform dashboard (stats via `/api/super/stats`)

### ✅ Phase 3 — Showroom Admin Panel (Week 2, Days 1–3)
- [ ] Initialize React + Vite for `client/` app
- [ ] Showroom login page (tenant JWT)
- [ ] Car inventory page — DynamicCarForm (reads FormField API)
- [ ] Multi-image upload to Cloudinary (tenant folder)
- [ ] Leads tracking table + status update
- [ ] Appointments table + confirm/cancel
- [ ] Dashboard stats
- [ ] Settings page (showroom profile, welcome message)
- [ ] Subscription page (read-only: plan, status, contact to renew)

### ✅ Phase 4 — WhatsApp Connection (Week 2, Days 4–5)
- [ ] Register Meta Developer account + system user token
- [ ] Setup Webhook: `GET /webhook` verify + `POST /webhook` receive
- [ ] Build WhatsApp service: `sendText(to, msg, tenant)`, `sendImage(...)`, `sendInteractiveMenu(...)`
- [ ] Webhook routes message to correct tenant by `phone_number_id`
- [ ] Test: two different WA numbers → two different tenants reply correctly

### ✅ Phase 5 — Session & State Machine (Week 3, Days 1–2)
- [ ] Build Session service (`getSession(tenantId, phone)`, `setState(...)`)
- [ ] Session scoped to `{ tenant_id, phone }` compound key
- [ ] Override keywords (hi, menu, back, help)
- [ ] Full `processMessage(phone, text, tenant)` state switch
- [ ] Stock code detector and handler
- [ ] Test: user navigates full menu, state persists between messages

### ✅ Phase 6 — NLP + Fuzzy Search (Week 3, Days 3–4)
- [ ] Gemini AI integration for query parsing
- [ ] Fuse.js fuzzy search (scoped to tenant's cars)
- [ ] Natural language flow: extract → DB query (tenant-scoped) → results
- [ ] Spelling correction message ("Auto-corrected from: ...")
- [ ] Sorting by price / year
- [ ] Pagination ("Send MORE for next 5 cars")

### ✅ Phase 7 — Rich Replies + Images (Week 3, Day 5)
- [ ] Car detail message with emojis using tenant's showroom info
- [ ] Send car images via WhatsApp media API
- [ ] Multiple results: up to 3 cars per reply
- [ ] "Book test drive?" CTA after viewing car

### ✅ Phase 8 — Appointment Booking (Week 4, Days 1–2)
- [ ] Full booking flow: date → name → confirm
- [ ] Save appointment with `tenant_id`
- [ ] Email notification to showroom owner (Nodemailer)
- [ ] Auto-create/update Lead when user books
- [ ] Confirmation WhatsApp message to customer

### ✅ Phase 9 — Super Admin WhatsApp Config (Week 4, Day 3)
- [ ] WhatsApp Config page in Super Admin — enter/edit `phone_number_id` + token per tenant
- [ ] "Test Connection" button — verify token via WhatsApp API
- [ ] Token stored AES-encrypted in DB

### ✅ Phase 10 — Testing & Deployment (Week 4, Days 4–5)
- [ ] Full end-to-end test with 2 showrooms, 2 WA numbers
- [ ] Verify data isolation: showroom A cannot see showroom B's data
- [ ] Edge case handling (empty results, invalid inputs, expired plan)
- [ ] Deploy backend + admin apps
- [ ] Go live!

---

## 15. Environment Variables

```env
# ─────────────────────────────────────────
# WhatsApp Cloud API
# ─────────────────────────────────────────
WHATSAPP_SYSTEM_TOKEN=EAAxxxxxxxxxxxxxx         # Permanent system user token
WHATSAPP_VERIFY_TOKEN=carbotai_verify_2026      # Webhook verify token (your custom string)
# Note: per-tenant phone_number_id and access tokens stored encrypted in DB

# ─────────────────────────────────────────
# Google Gemini AI
# https://aistudio.google.com/app/apikey
# ─────────────────────────────────────────
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXX

# ─────────────────────────────────────────
# MongoDB
# ─────────────────────────────────────────
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/carbotai

# ─────────────────────────────────────────
# Cloudinary (Image Upload/Storage)
# ─────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# ─────────────────────────────────────────
# Auth — TWO separate JWT secrets
# ─────────────────────────────────────────
TENANT_JWT_SECRET=tenant_jwt_secret_key_2026      # For showroom staff logins
SUPER_JWT_SECRET=super_admin_jwt_secret_2026       # For super admin login (different!)

# ─────────────────────────────────────────
# Encryption (for WhatsApp tokens in DB)
# ─────────────────────────────────────────
ENCRYPTION_KEY=32_char_random_hex_key_here_xxxxx

# ─────────────────────────────────────────
# Super Admin Credentials
# ─────────────────────────────────────────
SUPER_ADMIN_EMAIL=you@carbotai.in
SUPER_ADMIN_PASSWORD=YourSuperSecurePass123!

# ─────────────────────────────────────────
# Email (Nodemailer)
# ─────────────────────────────────────────
EMAIL_USER=support@carbotai.in
EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# ─────────────────────────────────────────
# Platform Info
# ─────────────────────────────────────────
PLATFORM_NAME=CarBot AI
PLATFORM_URL=https://carbotai.in
PLATFORM_SUPPORT_WHATSAPP=919876543210
TRIAL_DAYS=14

# ─────────────────────────────────────────
# Server
# ─────────────────────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SUPER_ADMIN_URL=http://localhost:5174
```

---

## 16. API Routes Reference

### WhatsApp Webhook (Public)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/webhook` | Webhook verification |
| POST | `/webhook` | Receive incoming WhatsApp messages |

### Auth — Tenant Staff
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Showroom staff login → returns Tenant JWT |
| GET | `/api/auth/me` | Get current user info |
| POST | `/api/auth/register` | Register new showroom (creates Tenant + owner TenantUser) |

### Auth — Super Admin
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/super/auth/login` | Super admin login → returns Super JWT |

### Cars (Tenant Auth Required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/cars` | Get all cars (tenant-scoped) |
| GET | `/api/cars/:id` | Get single car |
| GET | `/api/cars/code/:stock_code` | Get car by stock code (bot use) |
| POST | `/api/cars` | Add new car (checks plan limit) |
| PUT | `/api/cars/:id` | Update car |
| DELETE | `/api/cars/:id` | Delete / mark unavailable |

### Leads (Tenant Auth Required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/leads` | Get all leads (tenant-scoped) |
| PUT | `/api/leads/:id` | Update lead status / notes |
| DELETE | `/api/leads/:id` | Delete lead |

### Appointments (Tenant Auth Required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/appointments` | Get all appointments (tenant-scoped) |
| PUT | `/api/appointments/:id` | Confirm / Cancel |
| POST | `/api/appointments/:id/notify` | Send WA confirmation to customer |

### Tenant Settings (Tenant Auth Required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tenant/profile` | Get current showroom profile |
| PUT | `/api/tenant/profile` | Update showroom name, address, welcome message, logo |
| GET | `/api/tenant/subscription` | View plan, access status, expiry |
| GET | `/api/tenant/staff` | List staff users |
| POST | `/api/tenant/staff` | Add staff member |

### Form Fields (Tenant Auth Required — Read Only)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/form-fields` | Get all active car form fields (for dynamic form) |

### Super Admin Routes (Super Auth Required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/super/tenants` | List all tenants |
| GET | `/api/super/tenants/:id` | Single tenant detail |
| PUT | `/api/super/tenants/:id/access` | Toggle access, set expiry, plan, notes |
| PUT | `/api/super/tenants/:id/whatsapp` | Update WA phone_number_id + token |
| POST | `/api/super/tenants/:id/test-connection` | Test WA token validity |
| GET | `/api/super/stats` | Platform-wide statistics |
| GET | `/api/super/form-fields` | List all form fields |
| POST | `/api/super/form-fields` | Add form field |
| PUT | `/api/super/form-fields/:id` | Edit form field |
| DELETE | `/api/super/form-fields/:id` | Remove form field |

---

## 17. Example Conversations

### Conversation A — Natural Language Search → Booking
```
👤 User:    "hi"
🤖 Bot:     🙏 Welcome to Haripriya Cars! [Interactive menu]

👤 User:    "diesel automatic under 15 lakh"
🤖 Bot:     🔍 Found 3 cars: Hyundai Creta, Kia Seltos, MG Hector
            [Car list with stock codes]

👤 User:    "car03"
🤖 Bot:     [Car image + full details]
            Kia Seltos HTX 2021 — ₹14,50,000 | 1st Owner | 28,000 km
            Reply YES to book test drive!

👤 User:    "yes"
🤖 Bot:     📅 Choose date: 1️⃣ Tomorrow | 2️⃣ Day After | 3️⃣ Custom

👤 User:    "1"
🤖 Bot:     May I know your good name? 🙏

👤 User:    "Arjun Kumar"
🤖 Bot:     ✅ Appointment booked for 27 Feb! We'll call to confirm. Thank you! 🚗🙏
```

### Conversation B — Spelling Mistake Correction
```
👤 User:    "i want creata disel under 12 lak automatic"
🤖 Bot:     🔍 Showing results for: *Hyundai Creta Diesel Automatic*
            (Auto-corrected from: "creata disel")
            Found 2 matching cars: car05 — ₹11,80,000 | car09 — ₹10,50,000

👤 User:    "car05"
🤖 Bot:     [Image + full details] ... Reply YES to book!
```

### Conversation C — Expired Subscription
```
👤 User:    "hi"
🤖 Bot:     ⚠️ This bot is currently inactive.
            Please contact the showroom directly.
            📞 +91 98765 43210
```

---

## 18. Meta Developer Setup

### 18.1 One-Time Setup (You Do This Once)

**Step 1 — Create Meta Business Manager**
```
1. Go to https://business.facebook.com → Create Account
2. Business name: "CarBot AI"
3. Verify email
```

**Step 2 — Create Meta Developer App**
```
1. Go to https://developers.facebook.com
2. My Apps → Create App → Type: Business
3. App Name: "CarBot AI" | Link to your Business Manager account
4. Add WhatsApp product
```

**Step 3 — Verify Webhook**
```
WhatsApp → Configuration → Webhook → Edit
  Callback URL:  https://api.carbotai.in/webhook
  Verify Token:  [your WHATSAPP_VERIFY_TOKEN]
Click "Verify and Save" → Enable "messages" subscription
```

**Step 4 — Create Permanent System User Token**
```
Meta Business Manager → Settings → System Users → Add
  Name: carbotai-system | Role: Admin
  Generate Token → Permissions: whatsapp_business_messaging + whatsapp_business_management
  Save token → WHATSAPP_SYSTEM_TOKEN in .env
  This token NEVER expires and works for ALL your phone numbers.
```

### 18.2 Per-Showroom Setup (Repeat for Each Customer)

```
Step A: Showroom provides a fresh phone number (not used for personal WA)
Step B: Meta Developer Portal → WhatsApp → Phone Numbers → Add Phone Number
         Enter: Display Name = "Haripriya Cars", Category = Automotive
         Enter showroom's phone number → OTP verification
Step C: Copy the new phone_number_id
Step D: Super Admin → find showroom → WhatsApp Config → paste phone_number_id
         Click "Test Connection" → save
Step E: Super Admin → Access Control → activate access, set expiry, assign plan
Step F: Bot is live! Showroom messages their number → bot replies with showroom name ✅
```

### 18.3 Token Strategy

| Token Type | Expires | Used For |
|-----------|---------|----------|
| System User Token | Never | Production — one token for all numbers |
| Temporary Test Token | 24 hours | Development only |

### 18.4 Meta Business Verification

Required to remove sandbox restrictions (message anyone, not just test numbers).

```
1. Meta Business Suite → Settings → Business Info → Business Verification
2. Upload any 2 of: GST Certificate, MSME Udyam, Utility Bill, Bank Statement
3. Approval takes 2–7 days — start early!

Without verification:
  - Only 5 test numbers can message the bot
  - Max 2 phone numbers per app
  - Max 250 conversations/day

After verification:
  - Anyone can message
  - Up to 20+ phone numbers
  - 1,000+ conversations/day per number
```

---

## 19. Deployment Guide

### Backend (Node.js) — Render / Railway
```
1. Push server/ to GitHub
2. Create Web Service → connect repo → set root to server/
3. Build: npm install | Start: node index.js
4. Add all .env variables in dashboard
5. Webhook URL: https://api.carbotai.in/webhook
```

### Showroom Admin Panel — Vercel
```
1. Push client/ to GitHub
2. Import to Vercel → root: client/
3. Add: VITE_API_URL=https://api.carbotai.in
4. Deploy → panel.carbotai.in
```

### Super Admin Panel — Vercel
```
1. Push superadmin/ to GitHub
2. Import to Vercel → root: superadmin/
3. Add: VITE_API_URL=https://api.carbotai.in
4. Deploy → admin.carbotai.in
```

### MongoDB Atlas
```
1. Create free cluster at mongodb.com/atlas
2. Create database user + whitelist 0.0.0.0/0
3. MONGODB_URI → paste in server .env
```

---

## Quick Reference — Packages to Install

```bash
# Backend
npm install express mongoose dotenv cors helmet
npm install axios multer multer-storage-cloudinary cloudinary
npm install @google/generative-ai fuse.js
npm install jsonwebtoken bcryptjs
npm install nodemailer
npm install crypto-js node-cron
npm install nodemon --save-dev

# Showroom Admin Frontend (client/)
npm create vite@latest client -- --template react
cd client && npm install axios react-router-dom react-hot-toast lucide-react

# Super Admin Frontend (superadmin/)
npm create vite@latest superadmin -- --template react
cd superadmin && npm install axios react-router-dom react-hot-toast lucide-react
```

---

## Architecture Summary

```
One Meta App  →  All phone numbers  →  One webhook  →  Routes by phone_number_id  ✅
Showroom Admin  →  Manages own inventory, leads, appointments; sees subscription status  ✅
Super Admin  →  Activates access manually, configures WA per showroom, builds car form  ✅
Manual payment  →  Showroom pays you → you flip switch in Super Admin → bot goes live  ✅
Form builder  →  You control all car form fields; all showrooms render dynamically  ✅
Data isolation  →  Every query scoped by tenant_id — zero data leakage  ✅
```

---

*CarBot AI SaaS Platform — Updated March 2026*
