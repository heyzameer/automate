import dotenv from 'dotenv';
import { AppConfig } from '../types';
dotenv.config();

const config: AppConfig = {
    port: process.env.PORT || 5008,
    env: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/carbot_billing',
    internalSecret: process.env.INTERNAL_SECRET || 'carbot-internal-super-secret',
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
};

export default config;
