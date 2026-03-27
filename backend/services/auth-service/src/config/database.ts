import mongoose from 'mongoose';
import config from './index';
import { createLogger } from '@carbot/logger';

const logger = createLogger({
    serviceName: 'auth-service',
    nodeEnv: config.env,
    level: config.logs.level,
});

export class DatabaseConnection {
    private static _instance: DatabaseConnection;
    private _isConnected: boolean = false;

    private constructor() { }

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection._instance) {
            DatabaseConnection._instance = new DatabaseConnection();
        }
        return DatabaseConnection._instance;
    }

    public async connect(): Promise<void> {
        if (this._isConnected) {
            logger.info('Database already connected');
            return;
        }

        try {
            await mongoose.connect(config.database.uri, config.database.options);
            this._isConnected = true;
            logger.info('Database connected successfully');

            mongoose.connection.on('error', (error) => {
                logger.error('Database connection error:', error);
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('Database disconnected');
                this._isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                logger.info('Database reconnected');
                this._isConnected = true;
            });

        } catch (error) {
            logger.error('Database connection failed:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (!this._isConnected) {
            return;
        }

        try {
            await mongoose.disconnect();
            this._isConnected = false;
            logger.info('Database disconnected successfully');
        } catch (error) {
            logger.error('Error disconnecting from database:', error);
            throw error;
        }
    }

    public getConnectionStatus(): boolean {
        return this._isConnected;
    }
}
