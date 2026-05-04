# CarBot AI - Frontend Developer Guide

Welcome to the CarBot AI frontend! This guide outlines the core backend connections, authentication structures, and API behaviors established in **Week 1** development.

## 1. Local Development Setup

To speed up your workflow, a massive monorepo-wide script has been created. 
You can run the entire stack with a single command from the project root (`C:\PC\CarBot`):

```bash
npm run dev
# OR 
npm run dev:all
```
This runs the `auth-service` (Port 5001), `api-gateway` (Port 5000), and `AutoMoto` frontend (Port 5173) simultaneously using `concurrently`.

## 2. API Gateway Routing

All network requests from the frontend should point exclusively to the **API Gateway**:
`http://localhost:5000/api/v1`

For example, when logging in as a partner, you send the POST request to the Gateway (`/api/v1/auth/login`), and the Gateway silently routes it to the Auth Service.

## 3. Authentication & Middlewares

### JWT Token
The platform utilizes JSON Web Tokens (JWT) for session management. When a user authenticates, the backend returns an `accessToken`.
- **Frontend Action**: Ensure this token is stored securely (currently using `localStorage`) and appended to every request header (`Authorization: Bearer <token>`). Our `api.js` Axios interceptor already handles this automatically.

### Middlewares
The API routes are protected by three crucial layers in the backend:

1. **`authenticate`**: Verifies the JWT signature, un-packs the payload, checks if the user exists, and ensures the user's `isActive` status is `true`. It attaches `{ userId, role, email, tenantId }` to the backend logic.
2. **`tenantAuth`**: After authentication, this stops invalid showroom partners from accessing data. It checks if the overall Tenant (Showroom) is `isActive` and ensures the current date has not surpassed the `expiryDate` assigned to their plan.
3. **`superAuth`**: Explicitly blocks any incoming requests that do not possess the `SUPER_ADMIN` user role. Used strictly for `/super/*` dashboard endpoints.
4. **`planLimit`**: Limits resource creation (Cars/Leads) based on the subscription tier of the tenant (e.g., stopping a request to add a 51st car if the plan limit dictates a maximum of 50).

## 4. Immediate Development Pendings (To-Do)

Now that the foundational backend is complete, here are the core feature implementations pending on the React UI side (`AutoMoto` folder):

### A. Super Admin Panel
* **Dashboard Overview**: Enhance `/super/dashboard` to display meaningful stats (Total active tenants, total revenue, upcoming expiries).
* **WhatsApp Configuration**: Build a settings modal inside the Super Admin Tenants page to allow saving of Evolution API credentials (`instanceId`, `token`) directly to a tenant's database document.
* **Form Builder UI**: Develop a drag-and-drop or simple configuration builder to manage dynamic lead form fields (`/super/tenants/:id/form-fields`).

### B. Showroom Partner Panel
* **Subscription Read-Only Page**: Create a simple page inside the showroom dashboard indicating the partner's current active subscription (Plan type, Max Cars, Max Leads, and Expiry Date).
* **Settings Page**: Basic configuration settings view tailored around showroom preferences (e.g., toggling notifications, resetting passwords).

## 5. Standard Error Handling Workflow

Validation schemas using `Joi` have been strictly codified on the backend. If validation fails, standard formatting applies:
* **Response `success: false`**
* Standard HTTP error codes (400 for validation, 401 for Auth, 403 for permissions/limits, 409 for duplicates).
* **React Implementation**: The frontend makes use of `react-hot-toast` to handle global error captures seamlessly. If a tenant hits a plan limit, the toast will throw exactly what the backend responds with (`Plan limit reached. You can only create up to 50 cars...`).
