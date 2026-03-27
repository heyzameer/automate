import dotenv from 'dotenv';
dotenv.config();
import { AppConfig } from '../types';

const error = (message = 'error') => {
    throw new Error(`Config error: ${message}`);
};

const get = (key: string, required = false, fallback?: string): string | undefined => {
    const v = process.env[key];
    if ((v === undefined || v === '') && required) error(`${key} not defined`);
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
    port: getInt('PORT', true, 5000),
    env: get('NODE_ENV', true, 'development')!,
    maxSizeLimit: get('MAX_SIZE_LIMIT', false, '10mb')!,
    cors: {
        origin: get('CORS_ORIGIN', false, 'http://localhost:5173')!,
        credentials: getBool('CORS_CREDENTIALS', true),
    },
    rateLimit: {
        windowMs: getInt('RATE_LIMIT_WINDOW_MS', false, 15 * 60 * 1000),
        max: getInt('RATE_LIMIT_MAX', false, 1000),
    },
    logs: {
        level: get('LOG_LEVEL', false, 'info')!,
        maxSize: get('LOG_MAX_SIZE', false, '20m')!,
        maxFiles: get('LOG_MAX_FILES', false, '7d')!,
    },
    services: {
        auth: get('AUTH_SERVICE_URL', false, 'http://localhost:5001')!,
    },
};

export default config;
