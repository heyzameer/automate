import { getRabbitMQ } from '../utils/rabbitmq';
import { UsageService } from '../services/UsageService';
import { logger } from '../utils/logger';

export const initUsageConsumer = async () => {
    try {
        const mq = await getRabbitMQ();
        const usageService = new UsageService();

        await mq.consume('carbot_events', 'auth_usage_queue', ['usage.increment'], async (data: any) => {
            const { tenantId, service } = data;
            if (!tenantId || !service) return;

            logger.info(`[USAGE_CONSUMER] Incrementing ${service} for tenant ${tenantId}`);
            await usageService.incrementUsage(tenantId, service);
        });

        logger.info('Usage consumer initialized');
    } catch (error) {
        logger.error('Failed to init usage consumer', error);
    }
};
