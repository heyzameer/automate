import { RabbitMQService } from '@carbot/common';
import { logger } from './logger';

const rabbitMQ = new RabbitMQService(process.env.RABBITMQ_URL || 'amqp://localhost');

export const getRabbitMQ = async () => {
    try {
        await rabbitMQ.connect();
        return rabbitMQ;
    } catch (e) {
        logger.error('Failed to init RabbitMQ in whatsapp-bot-service', e);
        return rabbitMQ;
    }
};

export default rabbitMQ;
