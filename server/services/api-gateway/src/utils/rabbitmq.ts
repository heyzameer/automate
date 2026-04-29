import { RabbitMQService } from '@carbot/common';

const rabbitMQ = new RabbitMQService(process.env.RABBITMQ_URL || 'amqp://localhost');

let isConnecting = false;
export const getRabbitMQ = async (): Promise<RabbitMQService> => {
    if ((rabbitMQ as any).connection) return rabbitMQ;
    if (isConnecting) {
        await new Promise(res => setTimeout(res, 500));
        return getRabbitMQ();
    }

    try {
        isConnecting = true;
        await rabbitMQ.connect();
        return rabbitMQ;
    } catch (e) {
        console.error('Failed to init RabbitMQ in api-gateway', e);
        return rabbitMQ;
    } finally {
        isConnecting = false;
    }
};

export default rabbitMQ;
