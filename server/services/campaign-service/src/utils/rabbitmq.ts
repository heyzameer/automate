import { RabbitMQService } from '@carbot/common';
import { container } from 'tsyringe';
import { CampaignService } from '../services/CampaignService';
import { logger } from '../utils/logger';

const rabbitMQ = new RabbitMQService(process.env.RABBITMQ_URL || 'amqp://localhost');

export const initRabbitMQ = async () => {
    try {
        await rabbitMQ.connect();
        logger.info('Campaign Service attached to RabbitMQ');

        // Start Consumers
        await rabbitMQ.consume('carbot_events', 'campaign_queue', ['vehicle.created'], async (msg) => {
            const { tenantId, vehicle } = msg;
            logger.info(`Received vehicle.created event for tenant ${tenantId}`);
            
            try {
                const campaignService = container.resolve(CampaignService);
                await campaignService.handleNewArrival(tenantId, vehicle);
            } catch (error: any) {
                logger.error('Error processing vehicle.created event', { error: error.message });
            }
        });
    } catch (e) {
        logger.error('Failed to init RabbitMQ in campaign-service', e);
    }
};

export default rabbitMQ;
