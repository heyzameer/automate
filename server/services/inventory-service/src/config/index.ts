import dotenv from 'dotenv';
dotenv.config();
import { AppConfig } from '../types';

const error = (message = 'error') => {
    throw new Error(`Config error: ${message}`);
};

const get = (key: string, required = false, fallback?: string): string | undefined => {
    const v = process.env[key];
    if ((v === undefined || v === '') && required && fallback === undefined) error(`${key} not defined`);
    return (v === undefined || v === '') ? fallback : v;
};

const getInt = (key: string, required = false, fallback?: number, radix = 10): number => {
    const raw = get(key, required, fallback !== undefined ? String(fallback) : undefined);
    if (raw === undefined) {
        if (required) error(`${key} is not defined`);
        return fallback as number;
    }
    const n = parseInt(raw, radix);
    if (Number.isNaN(n)) error(`${key} is not a valid integer`);
    return n;
};

const getBool = (key: string, fallback = false): boolean => {
    const raw = get(key, false);
    if (raw === undefined) return fallback;
    return raw.toLowerCase() === 'true';
};

const config: AppConfig = {
    port: getInt('PORT', true, 5002),
    env: get('NODE_ENV', true, 'development')!,
    maxSizeLimit: get('MAX_SIZE_LIMIT', false, '50mb')!,
    jwtSecret: get('JWT_SECRET', true, 'supersecretjwtkeyforcarbotai2024')!,
    cors: {
        origin: get('CORS_ORIGIN', false, 'http://localhost:5173,http://localhost:5174')!,
        credentials: getBool('CORS_CREDENTIALS', true),
    },
    database: {
        uri: get('INVENTORY_MONGO_URI', false) || get('MONGODB_URI', true, 'mongodb://localhost:27017/carbot_inventory')!,
        options: {
            maxPoolSize: getInt('DB_MAX_POOL_SIZE', false, 10),
            serverSelectionTimeoutMS: getInt('DB_SERVER_SELECTION_TIMEOUT', false, 5000),
            socketTimeoutMS: getInt('DB_SOCKET_TIMEOUT', false, 45000),
            heartbeatFrequencyMS: getInt('DB_HEARTBEAT_FREQUENCY', false, 10000),
        },
    },
    rateLimit: {
        windowMs: getInt('RATE_LIMIT_WINDOW_MS', false, 15 * 60 * 1000),
        max: getInt('RATE_LIMIT_MAX', false, 1000),
    },
    logs: {
        level: get('LOG_LEVEL', false, 'info')!,
        directory: get('LOG_DIRECTORY', false, '../../logs')!,
        maxSize: get('LOG_MAX_SIZE', false, '20m')!,
        maxFiles: get('LOG_MAX_FILES', false, '7d')!,
    },
    cloudinary: {
        cloudName: get('CLOUDINARY_CLOUD_NAME', false, ''),
        apiKey: get('CLOUDINARY_API_KEY', false, ''),
        apiSecret: get('CLOUDINARY_API_SECRET', false, ''),
    },
    internalSecret: get('INTERNAL_SECRET', false, 'carbot-internal-super-secret')!,
};


export default config;
