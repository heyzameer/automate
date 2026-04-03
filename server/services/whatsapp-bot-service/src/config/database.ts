import mongoose, { Connection } from 'mongoose';
import { logger } from '../utils/logger';
import config from './index';

export class DatabaseConnection {
    private static instance: DatabaseConnection;
    private authConnection: Connection | null = null;
    private inventoryConnection: Connection | null = null;

    private constructor() {}

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    public async connect(): Promise<void> {
        try {
            // Main connection (default mongoose) - used for sessions/local data
            await mongoose.connect(config.database.authUri, config.database.options);
            logger.info(`Auth DB connected: ${config.database.authUri}`);

            // Direct secondary connection for Inventory
            this.inventoryConnection = mongoose.createConnection(config.database.inventoryUri, config.database.options);
            
            this.inventoryConnection.on('connected', () => {
                logger.info(`Inventory DB connected: ${config.database.inventoryUri}`);
            });

            this.inventoryConnection.on('error', (err) => {
                logger.error('Inventory DB error:', err);
            });

        } catch (error) {
            logger.error('Database connection error:', error);
            throw error;
        }
    }

    public getInventoryConnection(): Connection {
        if (!this.inventoryConnection) {
            throw new Error('Inventory connection not established');
        }
        return this.inventoryConnection;
    }

    public async disconnect(): Promise<void> {
        await mongoose.disconnect();
        if (this.inventoryConnection) {
            await this.inventoryConnection.close();
        }
        logger.info('Databases disconnected');
    }
}
