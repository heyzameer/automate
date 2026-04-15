import { Client, ClientOptions } from '@elastic/elasticsearch';
import { createLogger } from '../logger';

const logger = createLogger('ElasticClient');

export class ElasticClient {
    private client: Client | null = null;
    private options: ClientOptions;

    constructor(options: ClientOptions) {
        this.options = options;
    }

    public async connect(): Promise<Client> {
        if (!this.client) {
            try {
                this.client = new Client(this.options);
                // Ping to verify connection
                const ping = await this.client.ping();
                if (ping) {
                    logger.info(`Successfully connected to Elasticsearch at ${this.options.node}`);
                } else {
                    logger.warn('Elasticsearch ping failed.');
                }
            } catch (error: any) {
                logger.error('Failed to connect to Elasticsearch', { error: error.message });
                throw error;
            }
        }
        return this.client;
    }

    public getClient(): Client {
        if (!this.client) {
            throw new Error('Elasticsearch client has not been initialized. Call connect() first.');
        }
        return this.client;
    }

    public async initializeIndex(indexName: string, config: any): Promise<void> {
        const client = this.getClient();
        try {
            const exists = await client.indices.exists({ index: indexName });
            if (!exists) {
                await client.indices.create({
                    index: indexName,
                    ...config
                });
                logger.info(`Elasticsearch index '${indexName}' created successfully.`);
            } else {
                logger.info(`Elasticsearch index '${indexName}' already exists.`);
            }
        } catch (error: any) {
            logger.error(`Error initializing index ${indexName}:`, error.message);
            throw error;
        }
    }
}
