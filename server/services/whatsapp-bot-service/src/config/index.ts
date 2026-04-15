import path from 'path';
import dotenv from 'dotenv';
import { AppConfig } from '../types';

dotenv.config();

const config: AppConfig = {
    port: process.env.PORT || 3003,
    env: process.env.NODE_ENV || 'development',
    database: {
        authUri: process.env.AUTH_MONGO_URI || 'mongodb://localhost:27017/carbot_auth',
        inventoryUri: process.env.INVENTORY_MONGO_URI || 'mongodb://localhost:27017/carbot_inventory',
        options: {}
    },
    whatsapp: {
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'carbot_verify_token',
        apiVersion: process.env.WHATSAPP_API_VERSION || 'v19.0',
        appSecret: process.env.WHATSAPP_APP_SECRET,
        systemToken: process.env.WHATSAPP_SYSTEM_TOKEN
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || ''
    },
    maxSizeLimit: process.env.MAX_JSON_LIMIT || '10mb',
    logs: {
        level: 'info',
        directory: path.join(process.cwd(), '../../logs'),
        maxSize: '20m',
        maxFiles: '7d'
    },
    internalSecret: process.env.INTERNAL_SECRET || 'carbot-internal-super-secret'
};

export default config;

