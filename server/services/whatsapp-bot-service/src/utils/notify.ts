import axios from 'axios';
import { logger } from './logger';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5006';
const INTERNAL_SECRET = 'carbot-internal-super-secret';

export const notify = async (event: string, tenantId: string, data: any, idempotencyKey?: string) => {
    try {
        const mq = await import('./rabbitmq').then(m => m.getRabbitMQ());
        const payload = {
            tenantId,
            idempotencyKey: idempotencyKey || `${event}_${tenantId}_${Date.now()}`,
            data
        };
        await mq.publish('carbot_events', `notification.${event}`, { event, payload });
        
        logger.info(`Notification event published to RabbitMQ: ${event}`);
    } catch (error: any) {
        logger.error(`Failed to publish notification ${event}:`, error.message);
    }
};
