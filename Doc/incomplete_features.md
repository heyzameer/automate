# 🚀 CarBot AI — Incomplete Features List

This document outlines the features mentioned in the `PLATFORM_FEATURES_PLAN.md` and `WHATSAPP_BOT_PLAN.md` that are currently missing or partially implemented in the codebase.

---

### 1. 🏎️ Inventory Management (Module 1)
*   **360° Car View:**
    *   Missing `spin_images[]` in `Vehicle` model.
    *   No frontend component for the 360° interactive viewer.
*   **Structured Service History:**
    *   Currently only a `refurbishmentCost` field exists. The planned `service_history` array with dates, types, and receipt uploads is missing.
*   **VIN Tracking & Validation:**
    *   `vin` field is not yet standardized in the `Vehicle` schema (only `rcNumber` is present).
    *   Missing uniqueness validation for VIN across the same tenant.
*   **Insurance & RC Alerts:**
    *   Backend logic to trigger notifications 30/7 days before `insuranceExpiry` is not yet implemented.

### 2. 🤖 WhatsApp Automation (Module 2)
*   **EMI Calculator:**
    *   Planned NLP trigger ("EMI for car") and calculation logic are not fully integrated into `BotService.ts`.
*   **Document Collection:**
    *   Automated flow to request and store Aadhaar/PAN/RC photos via WhatsApp is missing.
*   **Festival Offers Auto-Campaign:**
    *   The campaign engine in `campaign-service` is in early stages; automated festival triggers are missing.
*   **Missed Call Auto-Message:**
    *   Integration with telephony APIs (Exotel/Truecaller) to trigger "Sorry we missed you" messages is missing.

### 3. 🎯 Lead Management CRM (Module 3)
*   **AI Lead Scoring:**
    *   Logic to assign Hot/Warm/Cold status based on engagement (points system) is not yet active.
*   **Kanban Board:**
    *   The frontend lacks a full Drag & Drop Kanban view for sales pipeline management.
*   **Incentive Tracking:**
    *   Calculation of sales commissions per agent is missing.

### 4. 🌐 Showroom Website Builder (Module 4)
*   **Custom Domain Support:**
    *   Infrastructure for CNAME mapping and SSL provisioning (Let's Encrypt) for tenant domains is missing.
*   **Google Review Integration:**
    *   Syncing reviews from Google Business Profile via API is not implemented.
*   **Blog Engine:**
    *   CMS capabilities for showroom owners to post articles.

### 5. 📢 Marketing Automation (Module 5)
*   **Meta Template Manager:**
    *   Interface to submit and track WhatsApp Message Templates for Meta approval.
*   **FB/IG Auto Posting:**
    *   Integration with Meta Graph API to auto-post new arrivals to social media pages.

### 6. 🧾 Billing & Accounting (Module 6)
*   **GST Invoice Generator:**
    *   PDF generation logic for compliant GST invoices.
*   **Delivery Note Generator:**
    *   Digital signature capture and delivery note PDF generation.
*   **Full Expense Tracking:**
    *   Tracking fixed costs (rent, salaries) vs. per-car variable costs.

---

### ⏳ Summary of Progress
| Module | Core Logic | UI/Frontend | Integration | Status |
| :--- | :---: | :---: | :---: | :--- |
| Inventory | ✅ | ⚠️ | ✅ | 70% |
| WhatsApp Bot | ✅ | N/A | ⚠️ | 60% |
| CRM | ⚠️ | ⚠️ | ⚠️ | 30% |
| Website | ⚠️ | ⚠️ | ⚠️ | 20% |
| Marketing | ❌ | ❌ | ❌ | 5% |
| Billing | ❌ | ❌ | ❌ | 0% |
