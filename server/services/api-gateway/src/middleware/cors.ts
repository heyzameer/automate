import cors from 'cors';
import config from '../config';
import { logger } from '../utils/logger';

// Parse allowed origins from config
const allowedOrigins = config.cors.origin.split(',').map(origin => origin.trim());

export const corsMiddleware = cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin) {
            return callback(null, true);
        }

        // Check if origin is in allowed list OR it's a localhost/kiosk development origin
        if (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true);
        } else {
            logger.warn(`CORS: Blocked request from origin: ${origin}`);
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    },
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-requested-with', 'x-kiosk-key'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours - cache preflight requests
});
