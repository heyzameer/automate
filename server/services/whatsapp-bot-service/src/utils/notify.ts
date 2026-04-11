import axios from 'axios';
import { logger } from './logger';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5006';
const INTERNAL_SECRET = 'carbot-internal-super-secret';

export const notify = async (event: string, tenantId: string, data: any, idempotencyKey?: string) => {
    try {
        await axios.post(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/dispatch`, {
            event,
            payload: {
                tenantId,
                idempotencyKey: idempotencyKey || `${event}_${tenantId}_${Date.now()}`,
                data
            }
        }, {
            headers: { 'x-internal-secret': INTERNAL_SECRET }
        });
        logger.info(`Notification event dispatched: ${event}`);
    } catch (error: any) {
        logger.error(`Failed to dispatch notification ${event}:`, error.message);
    }
};
