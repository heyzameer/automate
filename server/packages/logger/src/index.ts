/**
 * @carbot/logger
 * ═══════════════════════════════════════════════════════════
 * Centralised Winston logger factory.
 *
 * NOTE: Currently re-exported from @carbot/common for backwards compatibility.
 * This package will become the canonical source once all services migrate.
 *
 * Usage:
 *   import { createLogger } from '@carbot/logger';
 *   const logger = createLogger('my-service', logsConfig);
 * ═══════════════════════════════════════════════════════════
 */

// Re-export from common until fully migrated
export { createLogger } from '@carbot/common';
