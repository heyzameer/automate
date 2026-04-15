import axios from 'axios';
import config from '../config';

const INTERNAL_SECRET = config.internalSecret;

// Client for calling auth-service directly (internal)
export const authServiceClient = axios.create({
    baseURL: (process.env.AUTH_SERVICE_URL || 'http://localhost:5001') + '/api/v1',
    headers: { 'x-internal-secret': INTERNAL_SECRET }
});

// Client for calling inventory-service directly (internal)
export const inventoryServiceClient = axios.create({
    baseURL: process.env.INVENTORY_SERVICE_URL || 'http://localhost:5002',
    headers: { 'x-internal-secret': INTERNAL_SECRET }
});

export const botServiceClient = axios.create({
    baseURL: (process.env.BOT_SERVICE_URL || 'http://localhost:5003') + '/api/v1/bot',
    headers: { 'x-internal-secret': INTERNAL_SECRET }
});


// Generic API client - defaults to self
export const apiClient = botServiceClient;
