import mongoose, { Connection } from 'mongoose';
import { logger } from '../utils/logger';
import config from './index';

export class DatabaseConnection {
    private static instance: DatabaseConnection;

    private constructor() {}

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    public async connect(): Promise<void> {
        try {
            // Connect to Bot Service's own isolated database
            await mongoose.connect(config.database.authUri, config.database.options);
            logger.info(`Bot Database connected: ${config.database.authUri}`);

        } catch (error) {
            logger.error('Database connection error:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        await mongoose.disconnect();
        logger.info('Database disconnected');
    }
}
