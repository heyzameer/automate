import axios from 'axios';
import config from '../config';

const INTERNAL_SECRET = config.internalSecret;

// Client for calling inventory-service directly (internal)
export const inventoryServiceClient = axios.create({
    baseURL: (process.env.INVENTORY_SERVICE_URL || 'http://localhost:5002') + '/internal',
    headers: { 'x-internal-secret': INTERNAL_SECRET }
});

// Client for calling bot-service directly (internal)
export const botServiceClient = axios.create({
    baseURL: (process.env.BOT_SERVICE_URL || 'http://localhost:3003') + '/api/v1/bot/internal',
    headers: { 'x-internal-secret': INTERNAL_SECRET }
});


