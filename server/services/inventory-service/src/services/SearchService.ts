import { singleton } from 'tsyringe';
import { ElasticClient } from '@carbot/common';
import config from '../config';
import { logger } from '../utils/logger';
import Vehicle from '../models/Vehicle';

@singleton()
export class SearchService {
    private esClient: ElasticClient;
    private readonly indexName = 'carbot_vehicles_index';

    constructor() {
        this.esClient = new ElasticClient({
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        });
    }

    async init() {
        try {
            await this.esClient.connect();
            await this.esClient.initializeIndex(this.indexName, {
                // ... (mappings kept same)
                mappings: {
                    properties: {
                        tenantId: { type: 'keyword' },
                        status: { type: 'keyword' },
                        purchasePrice: { type: 'float' },
                        attributes: {
                            properties: {
                                brand: { type: 'keyword' },
                                model: { type: 'keyword' },
                                fuel_type: { type: 'keyword' },
                                price: { type: 'float' },
                                year_of_manufacture: { type: 'integer' },
                                car_code: { type: 'keyword' }
                            }
                        }
                    }
                }
            });

            // 🔄 Auto-Sync Available Cars
            const vehicles = await Vehicle.find({ status: 'available' });
            console.log(`🔄 [SEARCH_SYNC] Syncing ${vehicles.length} cars to Search Engine...`);
            
            for (const vehicle of vehicles) {
                await this.indexVehicle(vehicle.tenantId, vehicle);
            }
            
            logger.info('SearchService initialized and synced successfully');
        } catch (e) {
            logger.error('Failed to init SearchService', e);
        }
    }

    async indexVehicle(tenantId: string, vehicle: any) {
        try {
            const client = this.esClient.getClient();
            await client.index({
                index: this.indexName,
                id: vehicle._id.toString(),
                document: {
                    tenantId,
                    status: vehicle.status,
                    purchasePrice: vehicle.purchasePrice,
                    attributes: vehicle.attributes ? Object.fromEntries(vehicle.attributes) : {},
                    images: vehicle.images,
                    createdAt: vehicle.createdAt
                }
            });
        } catch (e: any) {
            logger.error(`Error indexing vehicle ${vehicle._id}: ${e.message}`);
        }
    }

    async deleteVehicle(vehicleId: string) {
        try {
            const client = this.esClient.getClient();
            await client.delete({
                index: this.indexName,
                id: vehicleId
            });
        } catch (e: any) {
            logger.error(`Error deleting vehicle from index ${vehicleId}: ${e.message}`);
        }
    }

    async searchVehicles(tenantId: string, filters: any) {
        try {
            const client = this.esClient.getClient();
            const must: any[] = [{ match: { tenantId } }];

            if (filters.status) must.push({ match: { status: filters.status } });
            if (filters.car_code) must.push({ match: { 'attributes.car_code': filters.car_code } });
            if (filters.brand) must.push({ match: { 'attributes.brand': filters.brand } });
            if (filters.model) must.push({ match: { 'attributes.model': filters.model } });
            if (filters.fuel_type) must.push({ match: { 'attributes.fuel_type': filters.fuel_type } });
            if (filters.year) must.push({ term: { 'attributes.year_of_manufacture': Number(filters.year) } });
            if (filters.max_price) must.push({ range: { 'attributes.price': { lte: Number(filters.max_price) } } });

            // Sort
            let sort: any = [{ createdAt: 'desc' }];
            if (filters.sortBy === 'price') {
                sort = [{ 'attributes.price': filters.sortOrder === 'desc' ? 'desc' : 'asc' }];
            }

            const response = await client.search({
                index: this.indexName,
                query: { bool: { must } },
                sort,
                size: filters.limit ? Number(filters.limit) : 20
            });

            return response.hits.hits.map((hit: any) => ({ _id: hit._id, ...hit._source }));
        } catch (e: any) {
            logger.error(`Error searching vehicles: ${e.message}`);
            return [];
        }
    }
}
