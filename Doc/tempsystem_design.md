# 🏛️ CarBot AI — System Design Overview

CarBot AI is built on a **Modular Microservices Architecture** within a monorepo, designed for multi-tenancy and scalability.

---

### 🗺️ High-Level Architecture

```mermaid
graph TD
    subgraph "External Clients"
        A[WhatsApp Mobile App]
        B[Showroom Web Admin]
        C[End-User Website]
    end

    subgraph "Edge Layer"
        G[API Gateway]
    end

    subgraph "Core Services"
        AUTH[Auth Service]
        INV[Inventory Service]
        BOT[WhatsApp Bot Service]
        NOTIF[Notification Service]
        CAMP[Campaign Service]
    end

    subgraph "Storage Layer"
        M_AUTH[(DB: carbot_auth)]
        M_INV[(DB: carbot_inventory)]
        REDIS[(Redis: Sessions/Cache)]
        RABBIT[RabbitMQ: Message Broker]
    end

    subgraph "Third Party"
        META[Meta WhatsApp Cloud API]
        GENAI[Google Gemini AI]
        CLOUDINARY[Cloudinary CDN]
    end

    %% Client Interactions
    A <--> META
    META <--> G
    B <--> G
    C <--> G

    %% Gateway Routing
    G --> AUTH
    G --> INV
    G --> BOT
    G --> NOTIF

    %% Database Connections
    AUTH --> M_AUTH
    INV --> M_INV
    BOT -.-> M_AUTH
    BOT -.-> M_INV

    %% Event Bus (Planned)
    INV --> RABBIT
    RABBIT --> BOT
    RABBIT --> NOTIF

    %% External Integrations
    INV --> GENAI
    BOT --> GENAI
    INV --> CLOUDINARY
```

---

### 📦 Component Breakdown

1.  **API Gateway (Express + `express-http-proxy`):**
    *   Single entry point for all frontend and webhook traffic.
    *   Handles **Auth Verification**, **Rate Limiting**, and **Request Routing**.
    *   *Port: 5000*

2.  **Auth Service:**
    *   Manages Showroom (Tenant) registration and User authentication.
    *   Implements **RBAC** (Owner, Manager, Staff).
    *   *Stats: Uses MongoDB `carbot_auth`.*

3.  **Inventory Service:**
    *   Core logic for car management, dynamic forms, and image uploads.
    *   Integrated with **Gemini AI** for price suggestions.
    *   Integrates with **Cloudinary** for media optimization.

4.  **WhatsApp Bot Service:**
    *   Handles real-time customer conversations via Meta Cloud API.
    *   Uses **Session Management** to track customer state.
    *   *Note: Currently "Reads" directly from Auth/Inventory DBs for performance (to be decoupled via PubSub).*

5.  **Common Package (`@carbot/common`):**
    *   Shared Middleware, Loggers, Exceptions, and Type definitions.
    *   Enforces consistent behavior across all microservices.

---

### 🛠️ Technology Stack
*   **Backend:** Node.js, TypeScript, Express.
*   **Frontend:** React, Tailwind CSS (Main Dashboard).
*   **Database:** MongoDB (using Mongoose).
*   **Infrastructure:** Docker, Turborepo, pnpm.
*   **AI:** Google Gemini (Generative models).
*   **Media:** Cloudinary (Automatic resizing & watermarking).
*   **Real-time:** Socket.io (for browser notifications).

---

### 🔐 Multi-Tenancy Strategy
CarBot AI uses a **"Shared Database, Shared Schema"** with a **Tenant ID Discriminator**.
*   Every record in MongoDB includes a `tenantId` field.
*   A custom Mongoose plugin in `@carbot/common` automatically injects `tenantId` filters into all queries (`find`, `update`, `delete`), ensuring data isolation between different car showrooms.
