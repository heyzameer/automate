import dotenv from 'dotenv';
import { AppConfig } from '../types';
dotenv.config();

const config: AppConfig = {
    port: process.env.PORT || 5008,
    env: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/carbot_billing',
    internalSecret: process.env.INTERNAL_SECRET || 'carbot-internal-super-secret',
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
    botServiceUrl: process.env.BOT_SERVICE_URL || 'http://localhost:3003',
    inventoryServiceUrl: process.env.INVENTORY_SERVICE_URL || 'http://localhost:5002',
    postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        username: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DB || 'carbot_billing',
    },
};

export default config;
