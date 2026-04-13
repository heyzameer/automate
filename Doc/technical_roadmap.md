# 🚀 CarBot AI: Technical Transformation Roadmap

This roadmap addresses the identified technical debt and aligns the project with modern microservices best practices.

## 🏗️ Phase 1: Structural & Architectural Reinforcement
*Goal: Move from basic microservices to a decoupled, resilient architecture.*

1.  **Pub/Sub Integration (RabbitMQ)**
    *   **Task**: Implement a messaging abstraction in `@carbot/common`.
    *   **Action**: Replace synchronous cross-service calls (e.g., Inventory → Campaign) with events like `VEHICLE.CREATED`.
    *   **Benefit**: Decouples services and prevents cascading failures if one service is down.

2.  **Clean Architecture Refactoring**
    *   **Task**: Transition services from "Controller-Service-Mongoose" to a truly Layered/Clean architecture.
    *   **Action**: 
        *   Define Domain Entities independent of Mongoose.
        *   Implement **Repository Pattern** to abstract database operations.
        *   Move business logic out of Controllers into **Use Cases**.

3.  **Basic Resilience Patterns**
    *   **Task**: Add Circuit Breakers and Retries.
    *   **Action**: Instrument `@carbot/common`'s HTTP client with `opossum` and `axios-retry`.

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
