# 🚀 CarBot AI: Technical Transformation Roadmap

This roadmap addresses the identified technical debt and aligns the project with modern microservices best practices.

## 🏗️ Phase 1: Structural & Architectural Reinforcement
*Goal: Move from basic microservices to a decoupled, resilient architecture.*

1.  ~~**Pub/Sub Integration (RabbitMQ)**~~ (✅ COMPLETED)
    *   **Task**: Implement a messaging abstraction in `@carbot/common`.
    *   **Action**: Replaced synchronous cross-service calls with events like `vehicle.created` (Inventory → Campaign) and `notification.*` (Bot → Notification Service).
    *   **Details**: Created a highly available `RabbitMQService` wrapper with reconnect logic. Configured reliable queue consumers in both Campaign and Notification services.

2.  **Clean Architecture Refactoring**
    *   **Task**: Transition services from "Controller-Service-Mongoose" to a truly Layered/Clean architecture.
    *   **Action**: 
        *   Define Domain Entities independent of Mongoose.
        *   Implement **Repository Pattern** to abstract database operations.
        *   Move business logic out of Controllers into **Use Cases**.

3.  ~~**Basic Resilience Patterns**~~ (✅ COMPLETED)
    *   **Task**: Add Circuit Breakers and Retries.
    *   **Details**: Developed a highly resilient shared `HttpClient` via `axios-retry` (exponential backoff) and `opossum` (Circuit Breaker with 50% threshold, 30s reset). Migrated components like Analytics and WhatsApp integrations off raw axios to use this client natively.

---

## 🏎️ Phase 2: Performance & Observability (Scale Prep)
*Goal: Optimize for speed and gain visibility into system health.*

1.  **CQRS (Physical Segregation)**
    *   **Task**: Separate Read and Write operations.
    *   **Action**: 
        *   Use MongoDB exclusively for Writes (Commands).
        *   Project data to **Elasticsearch** (Queries) for high-performance car searching in the WhatsApp bot.
        *   Implement Sync-consumers to keep the Search Index updated.

2.  **Distributed Observability**
    *   **Task**: Implement Prometheus, Grafana, and Loki.
    *   **Action**: 
        *   Add correlation IDs to all requests at the API Gateway.
        *   Expose `/metrics` endponts with `prom-client`.
        *   Centralize logs in Grafana Loki for multi-service debugging.

3.  **Polyglot Persistence (Billing)**
    *   **Task**: Introduce PostgreSQL for billing.
    *   **Action**: Migration of Ledger and Invoice tables from MongoDB to Postgres to ensure transaction integrity.

---

## 📱 Phase 3: Production Readiness & Deployment
*Goal: Transition from "Dev sandbox" to "Live platform".*

1.  **WhatsApp Production Migration**
    *   **Task**: Move beyond Sandbox limits.
    *   **Action**: Configure WhatsApp System User tokens and permanent Business IDs. Implement proper webhook signature verification.

2.  **Full-Stack Containerization (Deployment)**
    *   **Task**: Update `docker-compose.yml` to include ALL services.
    *   **Action**: Create Dockerfiles for the remaining 5 services, add health checks, and finalize the network bridge.

3.  **UI Polish**
    *   **Task**: Premium Experience.
    *   **Action**: Implement glassmorphic components, skeleton loaders, and real-time notification toasts for admin actions.

---

## 📊 Recommended Immediate Start
Based on your feedback that **"some APIs don't run sometimes"**, I suggest we start with:
1.  **Phase 1, Step 1 (Pub/Sub)**: This will remove the "Chain of Failure" between services.
2.  **Phase 1, Step 3 (Resilience)**: Adding Retries and Circuit Breakers will make the intermittent failures visible and self-healing.
