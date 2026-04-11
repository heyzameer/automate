# 🛠️ CarBot AI — Best Practices & Anti-patterns Review

This document analyzes the current architectural choices and identifies areas where industry best practices are either "missed" or in transition.

---

### 1. 🔄 Messaging & Event-Driven Architecture (PubSub)
*   **Current State:** Communication between services is primarily via direct database access (Shared DB) or synchronous HTTP calls.
*   **Anti-pattern:** **"Shared Database"**. Multiple services (e.g., WhatsApp Bot and Inventory) connecting to the same MongoDB databases. This creates tight coupling and makes scaling difficult.
*   **Missed Best Practice:** **Pub/Sub (Asynchronous Messaging)**. 
    *   *Action Required:* Integrate **RabbitMQ** (already in `docker-compose`) or **Redis Pub/Sub** to emit events like `VEHICLE_ADDED` or `LEAD_CAPTURED`.
    *   *Benefit:* If the Inventory service updates a car, the Bot service should receive an event to notify interested leads, without the Inventory service knowing about the Bot's existence.

### 2. 🏛️ CQRS (Command Query Responsibility Segregation)
*   **Current State:** Logical separation is present (Commands in `inventory-service`, Queries in `whatsapp-bot-service`), but they share the same physical database and schema.
*   **Anti-pattern:** **"Single Model for Read/Write"**. Complex car search queries in the bot compete for resources with heavy write operations in the admin panel.
*   **Missed Best Practice:** **Physical CQRS**.
    *   *Recommended:* Use **Elasticsearch** or **Algolia** for high-performance car searches (Read Model) while keeping MongoDB as the Source of Truth for updates (Write Model).

### 3. 🌐 Polyglot Persistence
*   **Current State:** 100% MongoDB.
*   **Best Practice Missed:** Using the right tool for the job.
    *   **PostgreSQL:** Better suited for **Module 6 (Billing & Accounting)** where ACID compliance and complex relational integrity (ledger entries, GST tax splits) are critical.
    *   **Redis:** Should be used for **Session Management** and **Rate Limiting** instead of persisting these in MongoDB.

### 4. 🛡️ Resilience Patterns
*   **Current State:** No explicit handling of service failures during inter-service communication.
*   **Anti-pattern:** **"Cascading Failures"**. If the `auth-service` is slow, the `api-gateway` hangs, potentially bringing down the entire entry point.
*   **Missed Best Practice:** **Circuit Breaker & Retries**.
    *   *Recommendation:* Implement `opossum` or a similar circuit breaker in the `@carbot/common` package for all outgoing service-to-service requests.

### 5. 🔍 Distributed Observability
*   **Current State:** Centralized logging to files via Winston.
*   **Missed Best Practice:** **Distributed Tracing**.
    *   *Requirement:* As requests cross multiple services (Gateway → Auth → Inventory), it becomes impossible to track the journey of a single request without **Correlation IDs** and **OpenTelemetry**.

---

### ✅ Summary Table
| Pattern | status | Recommendation |
| :--- | :---: | :--- |
| **Monorepo** | ✅ | Great for shared types and packages. |
| **DI (tsyringe)** | ✅ | Good modularity and testability. |
| **Pub/Sub** | ❌ | High priority: Decouple services using RabbitMQ. |
| **Statelessness** | ✅ | Services are easily scalable behind a balancer. |
| **Polyglot** | ⚠️ | Start using Postgres for financial/ledger data. |
| **Rate Limiting** | ✅ | Implemented at Gateway level. |
