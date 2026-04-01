# 🚗 CarBot AI — Full Platform Feature Plan
## Complete SaaS Product Roadmap & Feature Specification

> **Platform:** CarBot AI — All-in-One Car Dealership SaaS
> **Architecture:** Multi-Tenant SaaS (MERN Stack)
> **Target Users:** Used Car Showrooms / Car Dealerships across India
> **Date:** March 2026
> **Related Doc:** See `WHATSAPP_BOT_PLAN.md` for core bot + tenant architecture

---

## 📋 Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Module 1 — Inventory Management System](#2-module-1--inventory-management-system)
3. [Module 2 — WhatsApp Automation System](#3-module-2--whatsapp-automation-system)
4. [Module 3 — Lead Management CRM](#4-module-3--lead-management-crm)
5. [Module 4 — Showroom Website Builder](#5-module-4--showroom-website-builder)
6. [Module 5 — Marketing Automation Suite](#6-module-5--marketing-automation-suite)
7. [Module 6 — Billing & Accounting (Mini ERP)](#7-module-6--billing--accounting-mini-erp)
8. [Module 7 — Advanced Analytics Dashboard](#8-module-7--advanced-analytics-dashboard)
9. [SaaS Plan Tiers (Feature Gating)](#9-saas-plan-tiers-feature-gating)
10. [New MongoDB Schemas Required](#10-new-mongodb-schemas-required)
11. [New API Routes Required](#11-new-api-routes-required)
12. [Implementation Phases (Roadmap)](#12-implementation-phases-roadmap)

---

## 1. Platform Overview

**CarBot AI** is an all-in-one SaaS platform built specifically for used car dealerships and showrooms in India. It replaces spreadsheets, manual WhatsApp follow-ups, and fragmented tools with a single unified platform.

### The 7 Pillars of CarBot AI:

| # | Module | Core Value |
|---|--------|-----------|
| 1 | **Inventory Management** | Smart car listings with VIN, RC, insurance, service history |
| 2 | **WhatsApp Automation** | AI-powered chatbot + campaigns + follow-ups |
| 3 | **Lead Management CRM** | Full sales pipeline from lead capture to conversion |
| 4 | **Website Builder** | Auto-generated, SEO-optimized showroom website |
| 5 | **Marketing Automation** | WhatsApp / SMS / Email / Social media campaigns |
| 6 | **Billing & Accounting** | GST invoices, expense tracking, margin calculator |
| 7 | **Analytics Dashboard** | Revenue, sales funnel, agent productivity, marketing ROI |

### Who Uses What:

```
┌─────────────────────────────────────────────────────────────────────┐
│                       CARBOT AI PLATFORM                            │
│                                                                     │
│  👑 SUPER ADMIN         🏪 SHOWROOM OWNER        📱 CUSTOMER       │
│  admin.carbotai.in      panel.carbotai.in        WhatsApp Bot       │
│                                                  Showroom Website   │
│  - Manage all tenants   - All 7 modules          - Search cars      │
│  - Billing & plans      - Staff management       - Book test drive  │
│  - Platform analytics   - Bot + campaigns        - Get EMI quotes   │
│  - Feature gating       - Reports & analytics    - WhatsApp chat    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Module 1 — Inventory Management System

> **Goal:** Replace Excel/paper-based car inventory with a smart, digital system that tracks every detail of every car across its lifetime in the showroom.

---

### 2.1 Car Listing Management

#### ➕ Add / Edit / Delete Cars

| Feature | Description |
|---------|-------------|
| **Dynamic Car Form** | Fields defined by Super Admin via form builder (existing) |
| **Quick Add** | Minimal required fields — fill rest later |
| **Bulk Import** | Upload cars via CSV/Excel template |
| **Duplicate Car** | Clone similar listing, change VIN/price |
| **Car Status** | Available → Reserved → Sold → Archived |
| **Edit History** | Log every change with timestamp + who changed |

#### 🖼️ Multiple Images & Videos

| Feature | Description |
|---------|-------------|
| **Multi-Image Upload** | Upload 1–20 images per car, Cloudinary CDN |
| **Image Ordering** | Drag & drop to set cover photo + gallery order |
| **Video Upload** | Upload MP4 walkaround video (max 100MB) |
| **Video URL** | Accept YouTube/Drive link as alternative |
| **360° Car View** | Upload 24–36 sequential images for interactive spin viewer |
| **360° Viewer Widget** | Customer sees drag-to-spin experience on website + bot |
| **Image Compression** | Auto-compress on upload to save bandwidth |
| **Watermark** | Optional showroom logo watermark on images |

**360° Upload Flow:**
```
Showroom uploads 24+ photos taken in sequence around the car
→ System assigns spin_images[] array in Car schema
→ Website renders interactive 360° viewer using CSS/JS spin
→ WhatsApp bot sends "Type 360 to view spin view" + link to website
```

#### 🔎 VIN Tracking

| Feature | Description |
|---------|-------------|
| **VIN Field** | Vehicle Identification Number stored per car |
| **VIN Validation** | 17-character format validation |
| **VIN Uniqueness** | Prevent same VIN from being listed twice |
| **VIN Search** | Search inventory by VIN in admin panel |
| **VIN History** | If car was in system before (sold & re-listed), show previous record |

#### 📄 RC Details Storage

| Feature | Description |
|---------|-------------|
| **RC Number** | Registration Certificate number field |
| **RC Owner Name** | Name on RC (vs. actual seller) |
| **Registration Date** | Original registration date |
| **Registration State** | State of registration (MH, DL, KA, etc.) |
| **RC Copy Upload** | Upload scanned RC PDF/image (Cloudinary, private) |
| **RC Expiry** | RC validity date with alert if expiring |
| **Hypothecation** | Is there a bank loan/hypothecation on vehicle? |

#### 🛡️ Insurance Expiry Tracking

| Feature | Description |
|---------|-------------|
| **Insurance Policy Number** | Stored per vehicle |
| **Insurer Name** | Bajaj / HDFC / New India, etc. |
| **Insurance Type** | Comprehensive / Third Party |
| **Insurance Expiry Date** | Stored with automatic alerts |
| **🔔 Expiry Alert** | Alert showroom 30 days & 7 days before expiry |
| **Insurance Copy** | Upload policy document (PDF) |

#### 🔧 Service History Tracking

| Feature | Description |
|---------|-------------|
| **Service Records** | Add multiple service entries per car |
| **Service Date** | Date of each service |
| **Service Type** | Oil change / Major service / Accident repair / Detailing |
| **Service Cost** | Cost logged per service entry |
| **Service Center** | Where it was serviced |
| **Service Notes** | Free-text notes per entry |
| **Service Documents** | Upload bills/receipts per service |
| **Service Summary** | "Fully serviced – 3 services recorded" shown in bot reply |

**Database snippet — ServiceRecord (nested in Car):**
```js
service_history: [{
  date:           Date,
  type:           String,      // "Oil Change", "Major Service"
  cost:           Number,
  service_center: String,
  notes:          String,
  receipts:       [String],    // Cloudinary URLs
}]
```

---

### 2.2 Inventory Intelligence

#### 📅 Days in Inventory Tracking

| Feature | Description |
|---------|-------------|
| **Date Listed** | Automatically recorded when car is added |
| **Days Counter** | Real-time count of how many days car has been in stock |
| **Display in Table** | "32 days" shown in inventory list |
| **Color Coding** | 🟢 0–30 days / 🟡 31–60 days / 🔴 60+ days |
| **Aging Report** | Report: list all cars sorted by days in inventory |

#### 🤖 Auto Price Suggestion (AI)

| Feature | Description |
|---------|-------------|
| **Market Price Scan** | Fetch price range for same car from Carwale/OLX API (or scraping) |
| **AI Suggestion** | Gemini AI suggests optimal listing price based on: age, km, condition, market demand |
| **Price Gap Alert** | Alert if your listed price is >15% above market average |
| **"Price It Right" Badge** | Show on car listing if price is competitive |
| **Price History** | Log every price change with date |

**AI Price Prompt:**
```
Given car: {brand} {model} {year}, {km_driven}km, {fuel_type}, {owner} owner.
Showroom city: {city}.
Current listed price: ₹{price}.
Based on typical Indian used car market rates, suggest:
1. Recommended price range
2. Is current price competitive?
3. Negotiation room to leave
Return JSON: { suggested_min, suggested_max, verdict, reasoning }
```

#### 💰 Profit Margin Calculator

| Feature | Description |
|---------|-------------|
| **Purchase Price** | What showroom paid to acquire the car |
| **Refurbishment Cost** | Auto-summed from service history costs |
| **Other Expenses** | Transport, insurance, miscellaneous |
| **Total Cost** | Auto-calculated: purchase + refurb + expenses |
| **Selling Price** | Current listed price |
| **Expected Margin** | Gross margin % shown in real-time |
| **Margin View** | Toggle "show margin" for staff (role-based) |
| **Target Margin Alert** | Alert if margin drops below configured threshold (e.g. 8%) |

#### ⚠️ Car Aging Alerts

| Feature | Description |
|---------|-------------|
| **30-Day Alert** | Notification: "Car car07 has been in stock for 30 days" |
| **60-Day Alert** | Escalated alert with suggestion to reduce price |
| **90-Day Alert** | Critical alert: "Consider auctioning or repricing urgently" |
| **Alert Channels** | Dashboard notification + WhatsApp to showroom owner |
| **Mute Alert** | Option to snooze alert for 7 days |

#### 🐢 Slow-Moving Stock Alerts

| Feature | Description |
|---------|-------------|
| **View Count Tracking** | Count how many times each car was viewed in bot/website |
| **Inquiry Count** | Count WhatsApp inquiries per car |
| **Slow-Mover Definition** | < 3 inquiries in 30 days = slow mover |
| **Dashboard Widget** | "5 slow-moving cars need attention" card |
| **Action Suggestions** | "Reduce price / Boost on social / Run WhatsApp campaign" |

#### 📊 Demand Analytics by Area

| Feature | Description |
|---------|-------------|
| **Inquiry Heatmap** | Map showing where inquiries are coming from (city/pincode) |
| **Popular Models by Area** | "Maruti Swift is most searched in Pune" |
| **Budget Distribution** | Most common budget range of inquiries per area |
| **Trending Cars** | Which brands/models are trending in searches this week |
| **Source Tracking** | Breakdown: WhatsApp bot / Website / Facebook / Walk-in |

---

## 3. Module 2 — WhatsApp Automation System

> **Goal:** Turn WhatsApp from a manual messaging tool into a fully automated customer engagement engine.
> **Foundation:** See `WHATSAPP_BOT_PLAN.md` for core bot architecture (webhook, NLP, session management).

---

### 3.1 Customer Interaction (Chatbot Flows)

#### 👋 Welcome Bot (Already in WHATSAPP_BOT_PLAN.md — Extended)

| Feature | Description |
|---------|-------------|
| **Dynamic Greeting** | Personalised by time: "Good Morning! 🌅" / "Good Evening! 🌙" |
| **Returning Customer** | "Welcome back, Rahul! Want to continue from where you left?" |
| **Language Support** | Bot detects Hindi / English based on customer input |
| **Quick Replies** | WhatsApp interactive buttons for menu options |

#### 🔍 Smart Car Search

| Feature | Description |
|---------|-------------|
| **Budget Search** | "Cars under 5 lakh" |
| **Brand Search** | "Show me Honda cars" (with fuzzy matching for typos) |
| **KM Filter** | "Low km cars under 30,000 km" |
| **Multi-Filter NLP** | "Diesel SUV automatic under 10 lakh 2020 onwards" |
| **Sort Results** | By price, newest first, lowest km |
| **Paginated Results** | 3 results per page → "Send NEXT for more" |
| **360° View Link** | "Type 360 to see spin view" for cars with 360° photos |

#### 💸 EMI Calculator (Inside Chat)

| Feature | Description |
|---------|-------------|
| **Trigger** | Customer types "EMI" or "loan" or "finance" |
| **Inputs** | Car price (auto-filled from last viewed car) + down payment + tenure |
| **Calculation** | EMI = P × r(1+r)^n / ((1+r)^n – 1) at standard 9% p.a. |
| **Output** | "For ₹5L car, ₹1L down, 36 months → EMI ≈ ₹12,900/month" |
| **Bank List** | Send list of partner finance banks if configured |
| **Apply CTA** | "Interested in loan? Reply YES and we'll connect you" |

**EMI ChatFlow:**
```
Customer: EMI for car07
Bot: 📊 EMI Estimate for Maruti Swift VXI 2019 (₹5,50,000)
     Down Payment: How much can you pay upfront?
     Reply: 1️⃣ ₹50,000   2️⃣ ₹1,00,000   3️⃣ Custom amount

Customer: 2
Bot: Loan Amount: ₹4,50,000
     🕐 Choose loan tenure:
     1️⃣ 24 months  2️⃣ 36 months  3️⃣ 48 months  4️⃣ 60 months

Customer: 2
Bot: ✅ EMI Estimate (36 months @ 9% p.a.)
     Monthly EMI: ₹14,300 approx.
     Total Payable: ₹5,14,800
     Interest Paid: ₹64,800
     Want to apply for car loan? Reply YES 🚗
```

#### 📅 Test Drive Booking (Already in WHATSAPP_BOT_PLAN.md — Extended)

| Feature | Description |
|---------|-------------|
| **Time Slot Selection** | Choose morning / afternoon / evening slot |
| **Location Option** | Showroom visit or home test drive (if enabled) |
| **Confirmation SMS** | Auto-send summary via WhatsApp + owner gets email |
| **Reminder 24hr** | Auto-reminder WhatsApp message day before |
| **Reminder 2hr** | "Your appointment is in 2 hours" reminder |
| **Reschedule** | "Type RESCHEDULE to change date" |

#### 📋 Document Collection (via WhatsApp)

| Feature | Description |
|---------|-------------|
| **Trigger** | After lead is marked "hot" or deal is progressing |
| **Document Request** | Bot requests: Aadhaar / PAN / RC copy / Insurance |
| **Auto-Receive** | Customer sends photo → auto-saved to their lead profile |
| **Document Status** | Dashboard shows which documents are collected per lead |
| **Secure Storage** | Cloudinary private/restricted URL + access control |

---

### 3.2 WhatsApp Automation (Background Flows)

#### ⏰ Auto Follow-Up Reminders

| Feature | Description |
|---------|-------------|
| **Day 1 Follow-up** | "Hi {name}! Did you get a chance to think about the {car}?" |
| **Day 3 Follow-up** | "We still have {car} available. Want to schedule a visit?" |
| **Day 7 Follow-up** | "Final reminder — this car may sell soon! 🚨" |
| **Custom Intervals** | Showroom can configure follow-up timing |
| **Stop on Reply** | Follow-ups stop automatically if customer replies |
| **Opt-out** | Customer can type STOP to opt out |

#### 🎉 Festival Offers Auto-Campaign

| Feature | Description |
|---------|-------------|
| **Festival Calendar** | Pre-loaded: Diwali, Dusshera, Eid, Christmas, New Year, etc. |
| **Auto-Trigger** | 3 days before festival → auto-draft campaign message |
| **Preview before Send** | Owner reviews message in dashboard before it goes live |
| **Audience Select** | Send to: all leads / hot leads / old customers |
| **Message Template** | Pre-designed festival offer template with showroom name |

**Example Festival Campaign:**
```
🪔 *Diwali Special Offer from {showroom_name}!*

This Diwali, drive home your dream car! 🚗✨

🎁 Special discounts on 10 selected cars
📉 Price drop up to ₹50,000
🏦 Zero processing fee on car loans

🔗 Browse our Diwali stock: {website_link}
📞 Call us: {phone}

Reply STOP to opt out.
```

#### 📢 New Stock Broadcast

| Feature | Description |
|---------|-------------|
| **Auto-Trigger** | When a new car is marked "Available", option to broadcast |
| **Audience** | All past inquiries who searched for similar car (brand/budget match) |
| **Smart Match** | "Rahul searched for Swift under 6L — new Swift added at 5.5L" |
| **One-Click Broadcast** | Admin clicks "Notify matched leads" button on new car page |
| **Message Template** | Auto-generated with car photo + details |

#### 📞 Missed Call Auto-Message

| Feature | Description |
|---------|-------------|
| **Integration** | Connect showroom phone number (via Exotel/Truecaller API) |
| **Trigger** | If call goes unanswered → auto WhatsApp in 2 minutes |
| **Message** | "Hi! Sorry we missed your call. We're {showroom_name}. How can we help?" |
| **Quick Replies** | "Browse Cars" / "Book Visit" / "Call Back Request" |

#### 🔔 Abandoned Inquiry Reminder

| Feature | Description |
|---------|-------------|
| **Definition** | Customer starts bot conversation, browses cars, but goes silent |
| **Detection** | Session inactive > 2 hours while in SEARCH or VIEW_RESULTS state |
| **Trigger** | Auto-message: "Found something you liked? We're here to help!" |
| **Include Car** | If they last viewed a specific car, include its photo + link |

---

## 4. Module 3 — Lead Management CRM

> **Goal:** Capture every inquiry automatically, track every lead through the sales pipeline, and empower the sales team to close more deals.

---

### 4.1 Lead Tracking

#### 🎯 Auto Lead Capture

| Feature | Description |
|---------|-------------|
| **WhatsApp Bot** | Every new number → auto-create lead (existing) |
| **Website Form** | Leads from website contact/enquiry form |
| **Facebook Lead Ads** | Facebook Lead Ads → webhook → auto-import |
| **Walk-in** | Manual lead entry by staff |
| **Phone Call** | Manual log from missed/received calls |
| **Duplicate Detection** | Same phone → update existing lead, don't create duplicate |

#### 📌 Lead Source Tracking

| Feature | Description |
|---------|-------------|
| **Source Field** | WhatsApp Bot / Website / Facebook Ad / Instagram / Walk-in / Referral / Phone |
| **UTM Tracking** | Website leads carry UTM parameters (campaign, medium, source) |
| **FB Ads Integration** | Auto-tag leads with Ad Campaign name from Facebook |
| **Source Report** | Dashboard pie chart: which source brings most leads |

#### 🌡️ Lead Scoring (Hot / Warm / Cold)

| Feature | Description |
|---------|-------------|
| **Auto-Score** | AI assigns score based on: engagement level, budget mentioned, test drive booked |
| **Score Criteria** | Viewed 3+ cars = Warm / Booked test drive = Hot / No reply = Cold |
| **Manual Override** | Staff can manually change lead temperature |
| **Score Badge** | 🔴 Hot / 🟡 Warm / 🔵 Cold badge on every lead card |
| **Priority Queue** | Hot leads shown first in CRM table |

**Auto-Scoring Logic:**
```
+30 points: Booked a test drive
+20 points: Asked for EMI / finance
+20 points: Viewed specific car details
+15 points: Replied to follow-up
+10 points: Browsed 3+ cars
+10 points: Shared budget range
-10 points: Did not reply to follow-up
-20 points: Replied STOP
Score ≥ 60 = 🔴 Hot | 30–59 = 🟡 Warm | < 30 = 🔵 Cold
```

#### 📆 Follow-Up Scheduler

| Feature | Description |
|---------|-------------|
| **Schedule Follow-up** | Set date + time for next follow-up call/message |
| **Reminder Notification** | Dashboard notification + optional WhatsApp to staff |
| **Follow-up Notes** | Add notes after each follow-up attempt |
| **Follow-up History** | Full log of all past follow-up activities per lead |
| **Overdue Badge** | Red badge if scheduled follow-up is past due |

#### 📋 Sales Pipeline Board (Kanban View)

| Feature | Description |
|---------|-------------|
| **Kanban Columns** | New Inquiry → Contacted → Test Drive → Negotiation → Deal Closed / Lost |
| **Drag & Drop** | Move leads across stages by dragging |
| **Column Counts** | "8 leads in Contacted" shown on column header |
| **Card Preview** | Lead name, car interest, source, score, assigned agent |
| **Quick Actions** | Log call / Send WhatsApp / Schedule follow-up from card |
| **Filter View** | Filter by agent, source, date range, score |

---

### 4.2 Sales Team Management

#### 👤 Assign Leads to Agents

| Feature | Description |
|---------|-------------|
| **Manual Assign** | Owner/manager assigns lead to specific staff member |
| **Auto-Assign** | Round-robin auto-assignment to available agents |
| **Reassign** | Transfer lead to another agent with reason log |
| **Agent Workload** | See active lead count per agent |
| **Notification** | Agent gets WhatsApp notification when lead is assigned |

#### 📞 Call Tracking Logs

| Feature | Description |
|---------|-------------|
| **Log a Call** | Agent manually logs: date, duration, outcome, notes |
| **Call Outcome** | Not Answered / Interested / Not Interested / Follow-up Needed |
| **Call History** | Per-lead timeline of all calls logged |
| **Missed Call Log** | Auto-log when missed call integration is active |
| **Call Stats** | Total calls made per agent per day/week |

#### 📊 Agent Performance Dashboard

| Feature | Description |
|---------|-------------|
| **Leads Assigned** | Per agent this week/month |
| **Calls Made** | Count of logged calls per agent |
| **Test Drives Booked** | Conversion from lead to test drive |
| **Deals Closed** | Sales attributed to each agent |
| **Conversion Rate** | % of assigned leads → closed deals |
| **Leaderboard** | Ranked table of agents by performance |

#### 💹 Conversion Rate Tracking

| Feature | Description |
|---------|-------------|
| **Overall Rate** | Platform-wide: X% of leads become sales |
| **By Source** | Facebook leads convert at Y%, Walk-in at Z% |
| **By Agent** | Individual conversion rates |
| **By Car Type** | Which type of car converts fastest |
| **Funnel Chart** | Visual funnel: Leads → Contacted → Test Drive → Sold |

#### 🏆 Incentive Tracking

| Feature | Description |
|---------|-------------|
| **Incentive Rules** | Define commission per car sold (e.g., 1% of price or fixed ₹500) |
| **Auto-Calculate** | System auto-calculates when deal is marked "Closed" |
| **Incentive Report** | Per-agent earned incentives this month |
| **Payout Status** | Mark incentive as Paid / Pending |

---

## 5. Module 4 — Showroom Website Builder

> **Goal:** Every showroom gets a beautiful, SEO-optimized website automatically — no developer needed. Inventory syncs in real-time.

---

### 5.1 Auto Website Generation

#### 🌐 Auto-Generate Website

| Feature | Description |
|---------|-------------|
| **Instant Setup** | Website goes live when showroom onboards — no config needed |
| **URL Pattern** | `{slug}.carbotai.in` (e.g., `haripriya-cars.carbotai.in`) |
| **Custom Domain** | Point their own domain (e.g., `www.haripriyacars.com`) |
| **Branded Design** | Showroom name, logo, colors applied automatically |
| **Mobile-First** | Fully responsive on all devices |
| **Page Speed** | Optimized for Google Core Web Vitals |

#### 🔄 Inventory Sync with Website

| Feature | Description |
|---------|-------------|
| **Real-Time Sync** | Add car in admin → instantly live on website |
| **Sold Status** | Mark sold → auto-removed from listing (or shown as Sold) |
| **Filters on Website** | Budget / Brand / Fuel / Year filters for visitors |
| **Search Bar** | Full-text search on website |
| **Car Detail Page** | Full gallery + 360° view + specs + contact form |
| **WhatsApp CTA** | "Enquire on WhatsApp" button links to bot |

#### 🔍 SEO Optimized Pages

| Feature | Description |
|---------|-------------|
| **Auto Meta Tags** | Title + description auto-generated per car listing |
| **Schema Markup** | Product + Vehicle schema for Google rich results |
| **Sitemap** | Auto-generated XML sitemap |
| **URL Structure** | `/cars/maruti-swift-vxi-2019-petrol-mumbai` (human-readable) |
| **Page Speed** | Images served via Cloudinary CDN |
| **Local SEO** | Location-specific keywords in page titles |

#### 🌍 Custom Domain Support

| Feature | Description |
|---------|-------------|
| **CNAME Setup** | Guide for connecting custom domain (one-time DNS config) |
| **SSL Certificate** | Auto-provisioned via Let's Encrypt (HTTPS) |
| **Domain Status** | Show green/red domain status in admin panel |

#### 📝 Lead Form Integration

| Feature | Description |
|---------|-------------|
| **Contact Form** | On every car detail page: Name, Phone, Message |
| **Form Leads → CRM** | All form submissions automatically enter the CRM |
| **Thank You Page** | Auto-redirect to WhatsApp bot after form submit |
| **Spam Protection** | Google reCAPTCHA on forms |

---

### 5.2 Advanced Website Features

#### ⭐ Google Review Integration

| Feature | Description |
|---------|-------------|
| **Connect Google Business** | Showroom links their Google Business profile |
| **Auto-Fetch Reviews** | Pull latest reviews via Places API |
| **Review Widget** | Display 5-star reviews on homepage |
| **Review CTA** | "Leave us a Google Review" button for customers |

#### 💬 Chat Widget

| Feature | Description |
|---------|-------------|
| **WhatsApp Widget** | Floating WhatsApp button on website |
| **Chat Popup** | Pre-filled message: "Hi! I found you on your website..." |
| **Live Chat Option** | Optional: real-time chat widget (future) |

#### 📝 Blog Section

| Feature | Description |
|---------|-------------|
| **Blog Editor** | Rich text editor in admin panel |
| **Auto SEO** | Each blog post gets meta tags + slug |
| **Topic Suggestions** | AI suggests blog topics (e.g., "How to check used car history") |
| **Car Buying Guides** | Default template: guides relevant to their city |

#### 🎡 Featured Cars Carousel

| Feature | Description |
|---------|-------------|
| **Homepage Carousel** | Auto-rotating slider of featured/new arrival cars |
| **Pin Cars** | Mark specific cars as "Featured" to appear in carousel |
| **Auto-Feature** | Newest arrivals appear automatically if no manual pins |
| **Promo Banners** | Admin can add festival/offer banners to homepage |

---

## 6. Module 5 — Marketing Automation Suite

> **Goal:** Run targeted marketing campaigns across WhatsApp, SMS, Email, and Social Media from one unified dashboard.

---

### 6.1 Campaign Tools

#### 📱 WhatsApp Campaigns

| Feature | Description |
|---------|-------------|
| **Template Manager** | Create reusable WhatsApp message templates |
| **Meta Template Submit** | Submit templates for Meta approval from dashboard |
| **Audience Builder** | Filter by: all leads / hot leads / by car interest / by city |
| **Campaign Scheduler** | Schedule campaign for specific date/time |
| **Media Attachments** | Send image/video/PDF with campaign |
| **Variable Personalization** | {name}, {car_name}, {showroom_name} auto-filled |
| **Delivery Report** | Sent / Delivered / Read / Failed counts |
| **Opt-out Handling** | Auto-mark leads who reply STOP |

#### 📲 SMS Campaigns

| Feature | Description |
|---------|-------------|
| **SMS Gateway** | Integrate with Textlocal / MSG91 / Exotel |
| **Audience Filter** | Same as WhatsApp campaigns |
| **SMS Template** | 160-char limit with auto-character count |
| **Transactional SMS** | Appointment confirmations, test drive reminders |
| **DLT Registration** | Guide to register DLT sender ID (required in India) |
| **Delivery Report** | Sent / Delivered / Failed |

#### 📧 Email Campaigns

| Feature | Description |
|---------|-------------|
| **Email Editor** | Drag-and-drop email builder |
| **Pre-built Templates** | Festival offer / New stock / Monthly newsletter |
| **Audience Segments** | Filter by source, lead score, last activity |
| **Schedule** | Schedule email for optimal open time |
| **Open Rate Tracking** | Track open rate + click rate per campaign |
| **Unsubscribe** | Auto-handle unsubscribe links (CAN-SPAM compliant) |
| **Integration** | Send via Resend / SendGrid / Nodemailer |

#### 🎯 Click-to-WhatsApp Ads Automation

| Feature | Description |
|---------|-------------|
| **FB Ad Lead Webhook** | Receive leads from Facebook Click-to-WhatsApp ads |
| **Auto-Reply** | Customer clicks ad → WhatsApp opens → bot auto-greets |
| **Ad Attribution** | Tag each lead with Facebook Campaign / Ad Set / Ad name |
| **ROI Calculator** | Spend vs. leads vs. deals closed per campaign |

#### 📸 Facebook/Instagram Auto Posting

| Feature | Description |
|---------|-------------|
| **Connect Pages** | Link Facebook Page + Instagram Business via Meta Graph API |
| **Post Car Listings** | One-click post: car image + specs + price to FB + IG |
| **Auto-Post New Arrivals** | When car is added, option to auto-post immediately |
| **Scheduled Posts** | Queue posts for peak hours (evenings/weekends) |
| **Caption Generator** | AI writes engaging captions with emojis + CTA |
| **Stories** | Auto-create IG/FB Stories from car photos |

**Auto-Caption Example:**
```
🚗 *NEW ARRIVAL!* Maruti Swift VXI 2019

✅ Only 42,000 km driven
⛽ Petrol | ⚙️ Manual
👤 1st Owner | Accident-free
💰 Just ₹5,50,000

📞 Call/WhatsApp: +91 98765 43210
📍 Haripriya Cars, Mumbai

#UsedCars #Mumbai #MarutiSwift #CarForSale #HaripriyaCars
```

---

### 6.2 Retargeting

#### 🔁 Old Customer Remarketing

| Feature | Description |
|---------|-------------|
| **Sold Customer List** | List of customers who purchased in past |
| **Re-engagement Campaign** | 6 months / 1 year after purchase → reach out |
| **Insurance Renewal** | "Your car insurance might be expiring — we can help!" |
| **Service Reminder** | "Time for your next service? Visit our authorized partner" |
| **Referral Ask** | "Know someone looking for a car? We'll thank you with a gift!" |
| **New Arrival Alert** | "Your type of car just arrived – interested?" |
| **Anniversary Message** | "Happy 1 year of owning your Swift! 🎉" |

---

## 7. Module 6 — Billing & Accounting (Mini ERP)

> **Goal:** Replace manual/paper-based billing with a digital system that generates GST invoices, tracks expenses, and shows real profit per car.

---

### 7.1 Financial Tools

#### 🧾 GST Invoice Generator

| Feature | Description |
|---------|-------------|
| **Invoice Template** | Professional branded invoice with showroom logo |
| **GST Compliance** | CGST/SGST/IGST split as per applicable GST rules |
| **GSTIN Fields** | Showroom GSTIN + buyer GSTIN (for B2B) |
| **HSN Codes** | Pre-loaded HSN codes for used vehicles |
| **Invoice Number** | Auto-sequential invoice numbering (INV-2026-001) |
| **PDF Export** | Download/print as PDF |
| **Send via WhatsApp** | Send invoice PDF directly to customer on WhatsApp |
| **Send via Email** | Email invoice with one click |
| **Invoice History** | Search and filter all past invoices |

**Invoice Fields:**
```
- Seller: Showroom name, address, GSTIN
- Buyer: Customer name, address, phone, GSTIN (optional)
- Vehicle Details: Brand, Model, Year, VIN, RC Number
- Sale Price
- GST @ 18% (CGST 9% + SGST 9%)
- Total Amount
- Payment Mode: Cash / UPI / Bank Transfer / Cheque
- Payment Reference
- Terms & Conditions
- Authorized Signature
```

#### 📋 Delivery Note Generator

| Feature | Description |
|---------|-------------|
| **Auto-Generate** | Create delivery note when car is marked "Sold" |
| **Vehicle Handover** | Confirms vehicle handed over to buyer |
| **Key/Document Checklist** | RC copy / Insurance / Service book / Extra keys |
| **Digital Signature** | Buyer signs on touchscreen (via mobile) |
| **PDF + WhatsApp** | Deliver confirmation note to buyer on WhatsApp |

#### 💸 Expense Tracking

| Feature | Description |
|---------|-------------|
| **Expense Categories** | Rent / Electricity / Staff Salary / Advertising / Miscellaneous |
| **Per-Car Expenses** | Assign expense to specific car (purchase cost, transport, repair) |
| **Monthly Summary** | Total fixed vs. variable expenses per month |
| **Expense Upload** | Attach receipts/bills per expense entry |
| **GST Input Credit** | Mark expenses eligible for GST input tax credit |

#### 🔨 Repair Cost Management

| Feature | Description |
|---------|-------------|
| **Pre-Sale Repair Log** | Log all repairs done before listing (linked to car) |
| **Repair Categories** | Mechanical / Body / Electrical / Interior / Tyres |
| **Vendor Tracking** | Which mechanic/garage did the repair |
| **Repair Cost → Margin** | Auto-added to cost basis for margin calculation |
| **Photo Evidence** | Before/after repair photos per entry |

#### 💹 Margin Calculator

| Feature | Description |
|---------|-------------|
| **Per-Car P&L** | Purchase price + all costs vs. sale price = profit/loss |
| **Margin %** | Gross margin and net margin both shown |
| **Best Margin Cars** | Which cars gave highest profit |
| **Worst Margin Cars** | Cars that barely broke even or lost money |
| **Target Setting** | Set minimum acceptable margin % for alerts |

#### 📑 Sales Report

| Feature | Description |
|---------|-------------|
| **Daily Sales** | Cars sold today with prices |
| **Monthly Report** | Revenue / Costs / Profit for the month |
| **GST Report** | Output tax collected (for GST filing) |
| **Export** | Download as Excel / PDF |
| **Yearly Summary** | Financial year revenue summary |

---

## 8. Module 7 — Advanced Analytics Dashboard

> **Goal:** Give showroom owners and the platform super admin a complete, real-time view of business performance.

---

### 8.1 Showroom Analytics (Showroom Admin View)

#### 💰 Revenue Dashboard

| Feature | Description |
|---------|-------------|
| **Total Revenue** | This month / This year / All time |
| **Revenue Chart** | Line chart: monthly revenue trend |
| **Average Sale Price** | Mean car sale price |
| **Revenue by Car Type** | Sedan vs SUV vs Hatchback revenue breakdown |
| **Target vs Actual** | If monthly target is set, show % achieved |

#### 🚗 Car-Wise Profit Report

| Feature | Description |
|---------|-------------|
| **Per-Car P&L Table** | Every sold car: cost, sale price, profit, margin % |
| **Top Profit Cars** | Cars that gave best returns |
| **Loss-Making Cars** | Cars sold at loss (buy decisions review) |
| **Average Margin** | Rolling average profit margin |

#### 🔽 Sales Funnel Analysis

| Feature | Description |
|---------|-------------|
| **Funnel Stages** | Inquiries → Contacted → Test Drive → Negotiation → Closed |
| **Stage Conversion** | % converting from each stage |
| **Drop-off Point** | Where most leads drop off |
| **Avg Time per Stage** | How long leads stay in each stage on average |
| **Funnel by Source** | Separate funnel view per lead source |

#### 👤 Agent Productivity Report

| Feature | Description |
|---------|-------------|
| **Calls per Agent** | Daily/weekly call log counts |
| **Deals Closed** | Sales per agent per month |
| **Conversion Rate** | Leads assigned vs. closed per agent |
| **Avg Response Time** | How fast agents respond to new leads |
| **Incentives Earned** | Commission totals per agent |
| **Leaderboard** | Gamified ranking with badges |

#### 📈 Monthly Growth Charts

| Feature | Description |
|---------|-------------|
| **Leads Growth** | Month-over-month new leads |
| **Sales Growth** | Cars sold per month over 12 months |
| **Revenue Growth** | Revenue bar chart with % growth label |
| **Inventory Turnover** | How fast cars are selling (avg days to sell) |
| **WhatsApp Messages** | Volume of bot conversations per month |

#### 📢 Marketing ROI Tracking

| Feature | Description |
|---------|-------------|
| **Campaign Results** | Per-campaign: leads generated / cost / revenue attributed |
| **Cost Per Lead** | Ad spend ÷ leads per source |
| **Best Performing Channel** | Which source (FB Ad / WhatsApp / Website) gives best ROI |
| **Campaign Comparison** | Compare 2 campaigns side by side |

---

### 8.2 Super Admin Analytics (Platform-Wide)

| Feature | Description |
|---------|-------------|
| **Platform Revenue** | Total subscription revenue across all tenants |
| **Active Tenants** | Currently paying + active showrooms |
| **MRR / ARR** | Monthly/Annual Recurring Revenue |
| **Churn Rate** | Tenants who didn't renew |
| **Message Volume** | Total WhatsApp messages processed |
| **Top Tenants** | Showrooms with most leads/cars/activity |
| **Plan Distribution** | How many showrooms on Trial/Basic/Pro/Enterprise |
| **Geographic Distribution** | Tenant locations heatmap |

---

## 9. SaaS Plan Tiers (Feature Gating)

| Feature | 🆓 Trial | 🥉 Basic ₹999/mo | 🥈 Pro ₹2499/mo | 🥇 Enterprise ₹4999/mo |
|---------|---------|-----------------|----------------|----------------------|
| **Cars in Inventory** | 10 | 50 | 200 | Unlimited |
| **Leads/month** | 50 | 300 | 1000 | Unlimited |
| **Staff Accounts** | 1 | 3 | 10 | Unlimited |
| **WhatsApp Bot** | ✅ | ✅ | ✅ | ✅ |
| **Basic CRM** | ✅ | ✅ | ✅ | ✅ |
| **Inventory Intelligence** | ❌ | ✅ | ✅ | ✅ |
| **EMI Calculator Bot** | ❌ | ✅ | ✅ | ✅ |
| **Website Builder** | ❌ | ✅ (sub-domain) | ✅ + custom domain | ✅ |
| **AI Price Suggestion** | ❌ | ❌ | ✅ | ✅ |
| **Marketing Campaigns** | ❌ | ❌ | ✅ (WhatsApp only) | ✅ (All channels) |
| **GST Invoice Generator** | ❌ | ✅ | ✅ | ✅ |
| **Accounting / ERP** | ❌ | ❌ | ✅ | ✅ |
| **Advanced Analytics** | ❌ | Basic | Full | Full + Custom |
| **Facebook/IG Posting** | ❌ | ❌ | ✅ | ✅ |
| **360° Car View** | ❌ | ❌ | ✅ | ✅ |
| **Document Collection** | ❌ | ❌ | ✅ | ✅ |
| **Incentive Tracking** | ❌ | ❌ | ✅ | ✅ |
| **Priority Support** | ❌ | Email | Email + WhatsApp | Dedicated Manager |

---

## 10. New MongoDB Schemas Required

> These extend the schemas defined in `WHATSAPP_BOT_PLAN.md`.

### 10.1 Extended Car Schema (New Fields)

```js
// Additional fields to add to Car.model.js
{
  // Media
  videos:           [{ type: String }],      // Cloudinary video URLs
  spin_images:      [{ type: String }],      // 24–36 ordered images for 360° view
  has_360_view:     { type: Boolean, default: false },

  // VIN & Registration
  vin:              { type: String },        // 17-char Vehicle ID
  rc_number:        { type: String },
  rc_owner_name:    { type: String },
  registration_date: { type: Date },
  registration_state: { type: String },
  rc_document_url:  { type: String },        // Cloudinary private URL
  rc_expiry:        { type: Date },
  hypothecation:    { type: Boolean, default: false },
  hypothecation_bank: { type: String },

  // Insurance
  insurance_policy_no: { type: String },
  insurer_name:     { type: String },
  insurance_type:   { type: String, enum: ['Comprehensive','Third Party'] },
  insurance_expiry: { type: Date },
  insurance_doc_url: { type: String },

  // Service History
  service_history: [{
    date:           { type: Date },
    type:           { type: String },
    cost:           { type: Number },
    service_center: { type: String },
    notes:          { type: String },
    receipts:       [{ type: String }],
  }],

  // Inventory Intelligence
  listed_date:      { type: Date, default: Date.now },  // for days-in-inventory
  view_count:       { type: Number, default: 0 },
  inquiry_count:    { type: Number, default: 0 },
  price_history:    [{ price: Number, changed_at: Date, changed_by: String }],
  ai_suggested_price_min: { type: Number },
  ai_suggested_price_max: { type: Number },
  ai_price_verdict: { type: String },

  // Financials (hidden from public)
  purchase_price:   { type: Number },
  refurb_cost:      { type: Number, default: 0 },
  other_expenses:   { type: Number, default: 0 },
  sold_price:       { type: Number },
  sold_date:        { type: Date },
  sold_to_lead:     { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  profit_margin:    { type: Number },        // auto-calculated on sale
}
```

### 10.2 Invoice Schema

```js
const InvoiceSchema = new mongoose.Schema({
  tenant_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  invoice_no:   { type: String, required: true },
  invoice_date: { type: Date, default: Date.now },
  type:         { type: String, enum: ['sale','purchase','repair'], default: 'sale' },

  // Seller (showroom details)
  seller_name:  { type: String },
  seller_gstin: { type: String },
  seller_address: { type: String },

  // Buyer
  buyer_name:   { type: String },
  buyer_phone:  { type: String },
  buyer_address: { type: String },
  buyer_gstin:  { type: String },

  // Vehicle
  car_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  vin:          { type: String },
  rc_number:    { type: String },
  brand:        { type: String },
  model:        { type: String },
  year:         { type: Number },

  // Financials
  base_price:   { type: Number },
  gst_rate:     { type: Number, default: 18 },
  cgst:         { type: Number },
  sgst:         { type: Number },
  igst:         { type: Number, default: 0 },
  total_amount: { type: Number },

  // Payment
  payment_mode: { type: String, enum: ['Cash','UPI','Bank Transfer','Cheque'] },
  payment_ref:  { type: String },

  pdf_url:      { type: String },   // Cloudinary PDF URL
  status:       { type: String, enum: ['draft','sent','paid'], default: 'draft' },
}, { timestamps: true });
```

### 10.3 Expense Schema

```js
const ExpenseSchema = new mongoose.Schema({
  tenant_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  car_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },  // null = overhead
  category:    { type: String, enum: ['Rent','Salary','Advertising','Repair','Transport','Utilities','Miscellaneous'] },
  description: { type: String },
  amount:      { type: Number, required: true },
  date:        { type: Date, default: Date.now },
  vendor:      { type: String },
  receipt_url: { type: String },
  gst_eligible: { type: Boolean, default: false },
  logged_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'TenantUser' },
}, { timestamps: true });
```

### 10.4 Campaign Schema

```js
const CampaignSchema = new mongoose.Schema({
  tenant_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name:         { type: String, required: true },
  type:         { type: String, enum: ['whatsapp','sms','email','social'], default: 'whatsapp' },
  status:       { type: String, enum: ['draft','scheduled','running','completed','failed'], default: 'draft' },
  audience:     {
    segment:    { type: String, enum: ['all','hot','warm','cold','old_customers'] },
    filters:    { type: mongoose.Schema.Types.Mixed },
    total_count: { type: Number },
  },
  message:      {
    template_id:  { type: String },
    body:         { type: String },
    media_url:    { type: String },
    variables:    [{ key: String, value: String }],
  },
  schedule_at:  { type: Date },
  sent_at:      { type: Date },
  stats: {
    sent:       { type: Number, default: 0 },
    delivered:  { type: Number, default: 0 },
    read:       { type: Number, default: 0 },
    failed:     { type: Number, default: 0 },
    replies:    { type: Number, default: 0 },
  },
}, { timestamps: true });
```

### 10.5 WebsitePage Schema

```js
const WebsitePageSchema = new mongoose.Schema({
  tenant_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  slug:          { type: String, default: 'home' },
  custom_domain: { type: String },
  theme_color:   { type: String, default: '#1e40af' },
  banner_images: [{ type: String }],
  featured_cars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Car' }],
  google_place_id: { type: String },
  blog_posts: [{
    title:       String,
    slug:        String,
    content:     String,
    cover_image: String,
    published_at: Date,
  }],
  seo: {
    meta_title:    { type: String },
    meta_description: { type: String },
    keywords:      [String],
  },
  is_published:  { type: Boolean, default: true },
}, { timestamps: true });
```

---

## 11. New API Routes Required

> These extend the existing routes in `WHATSAPP_BOT_PLAN.md`.

```
MODULE 1 — INVENTORY
POST   /api/cars/:id/service-history        → Add service record
GET    /api/cars/:id/service-history        → List service records
POST   /api/cars/:id/360-images             → Upload spin images
GET    /api/cars/aging-report               → Cars sorted by days in inventory
GET    /api/cars/:id/ai-price               → Fetch AI price suggestion
POST   /api/cars/:id/price-history          → Log price change
PATCH  /api/cars/:id/mark-sold              → Mark sold + record profit

MODULE 2 — WHATSAPP AUTOMATION
POST   /api/campaigns                       → Create campaign
GET    /api/campaigns                       → List campaigns
PATCH  /api/campaigns/:id/send             → Trigger campaign send
GET    /api/campaigns/:id/stats            → Campaign analytics
POST   /api/followup-rules                 → Set auto follow-up rules
GET    /api/followup-rules                 → Get current rules

MODULE 3 — CRM
PATCH  /api/leads/:id/assign               → Assign lead to agent
POST   /api/leads/:id/call-log             → Log a call
GET    /api/leads/:id/timeline             → Full lead activity timeline
GET    /api/analytics/funnel               → Sales funnel data
GET    /api/analytics/agents               → Agent performance report
POST   /api/incentive-rules                → Configure incentive rules
GET    /api/incentives                     → Incentive payout report

MODULE 4 — WEBSITE
GET    /api/website                        → Get website config
PUT    /api/website                        → Update website settings
POST   /api/website/blog                   → Create blog post
GET    /api/website/blog                   → List blog posts
PUT    /api/website/domain                 → Set custom domain

MODULE 5 — MARKETING
POST   /api/social/post                    → Post to FB + IG
GET    /api/social/accounts               → Check connected social accounts
POST   /api/social/connect                → OAuth connect FB/IG page

MODULE 6 — BILLING
POST   /api/invoices                       → Create GST invoice
GET    /api/invoices                       → List invoices
GET    /api/invoices/:id/pdf              → Download invoice PDF
POST   /api/expenses                       → Add expense
GET    /api/expenses                       → List expenses
GET    /api/reports/gst                    → GST report
GET    /api/reports/sales                  → Sales report
GET    /api/reports/profit                 → Per-car profit report

MODULE 7 — ANALYTICS
GET    /api/analytics/revenue             → Revenue dashboard data
GET    /api/analytics/marketing-roi       → Campaign ROI data
GET    /api/analytics/growth              → Monthly growth charts
GET    /api/analytics/inventory           → Inventory intelligence stats
```

---

## 12. Implementation Phases (Roadmap)

> Building in order of user value and technical dependency.

### 🟢 Phase 1 — Core Platform (Done / In Progress)
> Ref: `WHATSAPP_BOT_PLAN.md` — Existing implementation

- [x] Multi-tenant SaaS architecture
- [x] WhatsApp chatbot (search, NLP, appointment booking)
- [x] Showroom admin panel (cars, leads, appointments)
- [x] Super admin panel (tenant management, access control)
- [x] Basic car inventory (CRUD + images)
- [x] Basic lead tracking

---

### 🟡 Phase 2 — Inventory Intelligence + Extended Car Details
> **Timeline: Month 1–2**

- [ ] VIN + RC details schema + UI fields
- [ ] Insurance expiry tracking + alerts
- [ ] Service history log (add/view per car)
- [ ] Multiple video uploads + 360° image upload + viewer
- [ ] Days-in-inventory tracker + color coding
- [ ] Car aging alerts (30/60/90 day)
- [ ] Profit margin calculator (purchase price + costs vs. sale price)
- [ ] Price history log

---

### 🟡 Phase 3 — CRM Upgrade + WhatsApp Automation Flows
> **Timeline: Month 2–3**

- [ ] Lead scoring (auto Hot/Warm/Cold)
- [ ] Kanban sales pipeline board
- [ ] Assign leads to agents + agent workload view
- [ ] Call tracking log
- [ ] Follow-up scheduler with overdue alerts
- [ ] Auto follow-up WhatsApp messages (Day 1 / Day 3 / Day 7)
- [ ] Abandoned inquiry reminder
- [ ] EMI calculator inside chatbot
- [ ] Document collection via WhatsApp
- [ ] New stock broadcast to matched leads

---

### 🟠 Phase 4 — Website Builder
> **Timeline: Month 3–4**

- [ ] Auto-generate showroom website on tenant onboarding
- [ ] Real-time inventory sync
- [ ] Car detail page with 360° viewer
- [ ] SEO meta tags + sitemap generation
- [ ] Lead form → CRM integration
- [ ] WhatsApp chat widget
- [ ] Custom domain + SSL support
- [ ] Google Reviews widget
- [ ] Featured cars carousel + banner management
- [ ] Blog section + AI topic suggestions

---

### 🟠 Phase 5 — Marketing Automation Suite
> **Timeline: Month 4–5**

- [ ] WhatsApp campaign builder (template + audience + schedule)
- [ ] Festival campaign auto-trigger
- [ ] SMS campaign integration (MSG91)
- [ ] Email campaign builder (Resend + drag-drop editor)
- [ ] Facebook/Instagram auto-posting (Meta Graph API)
- [ ] AI-generated social media captions
- [ ] Click-to-WhatsApp ad lead capture + attribution
- [ ] Old customer remarketing flows
- [ ] Campaign analytics dashboard

---

### 🔴 Phase 6 — Billing & Accounting (Mini ERP)
> **Timeline: Month 5–6**

- [ ] GST invoice generator (PDF)
- [ ] Send invoice via WhatsApp + Email
- [ ] Delivery note generator
- [ ] Expense tracking (per-showroom + per-car)
- [ ] Repair cost management
- [ ] Per-car P&L report
- [ ] Monthly sales + GST report
- [ ] Excel export for all reports
- [ ] AI price suggestion engine

---

### 🔴 Phase 7 — Advanced Analytics
> **Timeline: Month 6–7**

- [ ] Revenue dashboard (charts + trends)
- [ ] Sales funnel analysis
- [ ] Agent productivity report + leaderboard
- [ ] Marketing ROI tracker
- [ ] Demand analytics (popular models by area)
- [ ] Slow-moving stock alerts
- [ ] Super admin platform-wide analytics (MRR, churn, top tenants)
- [ ] Exportable reports (PDF + Excel)

---

## 📌 Summary

| Module | Priority | Phase | Complexity |
|--------|----------|-------|-----------|
| Inventory Intelligence | High | 2 | Medium |
| CRM Upgrade | High | 3 | High |
| WhatsApp Automation | High | 3 | High |
| Website Builder | Medium | 4 | High |
| Marketing Suite | Medium | 5 | High |
| Billing / ERP | Medium | 6 | Medium |
| Advanced Analytics | Low | 7 | Medium |

> 🚀 **Next Step:** Start with Phase 2 — extend the Car schema with VIN/RC/insurance/service fields, add the new form fields, and build out the inventory intelligence UI.

---

*Last Updated: March 2026 | CarBot AI Platform v2.0*
