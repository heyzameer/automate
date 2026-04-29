import { RabbitMQService } from '@carbot/common';

const rabbitMQ = new RabbitMQService(process.env.RABBITMQ_URL || 'amqp://localhost');

import { container } from 'tsyringe';
import { SearchService } from '../services/SearchService';

export const getRabbitMQ = async (): Promise<RabbitMQService> => {
    try {
        await rabbitMQ.connect();

        const searchService = container.resolve(SearchService);
        await searchService.init();

        await rabbitMQ.consume('inventory_search_queue', 'carbot_events', ['vehicle.created'], async (data) => {
            await searchService.indexVehicle(data.tenantId, data.vehicle);
        });
        await rabbitMQ.consume('inventory_search_queue', 'carbot_events', ['vehicle.updated'], async (data) => {
            await searchService.indexVehicle(data.tenantId, data.vehicle);
        });
        await rabbitMQ.consume('inventory_search_queue', 'carbot_events', ['vehicle.deleted'], async (data) => {
            await searchService.deleteVehicle(data.id.toString());
        });

        return rabbitMQ;
    } catch (e) {
        console.error('Failed to init RabbitMQ in inventory-service', e);
        return rabbitMQ;
    }
};

export default rabbitMQ;
