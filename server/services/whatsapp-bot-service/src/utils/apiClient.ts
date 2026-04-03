import axios from 'axios';

const INTERNAL_SECRET = 'carbot-internal-super-secret';

// Client for calling auth-service directly (internal)
export const authServiceClient = axios.create({
    baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
    headers: { 'x-internal-secret': INTERNAL_SECRET }
});

// Client for calling inventory-service directly (internal)
export const inventoryServiceClient = axios.create({
    baseURL: process.env.INVENTORY_SERVICE_URL || 'http://localhost:5002',
    headers: { 'x-internal-secret': INTERNAL_SECRET }
});

// Client for calling self (bot-service) internal routes for leads
export const botServiceClient = axios.create({
    baseURL: process.env.BOT_SERVICE_URL || 'http://localhost:5003',
    headers: { 'x-internal-secret': INTERNAL_SECRET }
});

// Generic API client - defaults to self
export const apiClient = botServiceClient;
