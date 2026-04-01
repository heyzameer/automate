/**
 * auth-service — Event Subscribers
 * ==================================
 * This directory contains handlers for events consumed from the message broker
 * (RabbitMQ / Kafka). The auth-service can subscribe to cross-service events
 * and react asynchronously (Eventual Consistency pattern).
 *
 * Pattern:
 *   1. A subscriber connects to the message broker on startup.
 *   2. It listens to a specific queue or topic.
 *   3. On message receive, it delegates to the appropriate service method.
 *
 * Example events auth-service may consume:
 *   - billing.subscription.expired   → deactivate tenant
 *   - billing.subscription.renewed   → reactivate tenant
 *   - admin.user.force-logout        → invalidate all sessions for a user
 *
 * See @carbot/events package (packages/events/) for shared event schemas.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO: Implement once RabbitMQ / Kafka is wired up in packages/events.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export {};
