import { RabbitMQService } from '@carbot/common';
import { container } from 'tsyringe';
import { NotificationService } from '../services/NotificationService';
import { logger } from '../utils/logger';

const rabbitMQ = new RabbitMQService(process.env.RABBITMQ_URL || 'amqp://localhost');

export const initRabbitMQ = async () => {
    try {
        await rabbitMQ.connect();
        logger.info('Notification Service attached to RabbitMQ');

        // Start Consumers
        await rabbitMQ.consume('carbot_events', 'notification_queue', ['notification.*', 'tenant.*'], async (msg) => {
            const { event, payload } = msg;
            logger.info(`Received notification event ${event} from queue`);
            
            try {
                const notificationService = container.resolve(NotificationService);
                // Notification routing logic based on event type
                // Payload structure: { tenantId, idempotencyKey, data }
                if (event === 'NEW_LEAD') {
                    await notificationService.dispatch('lead.assigned', payload);
                } else if (event === 'PAYMENT_RECEIVED') {
                    await notificationService.dispatch('payment.received', payload);
                }
                // Add more event handlers as needed
            } catch (error: any) {
                logger.error('Error processing notification event', { error: error.message });
            }
        });
    } catch (e) {
        logger.error('Failed to init RabbitMQ in notification-service', e);
    }
};

export default rabbitMQ;
