import Redis from 'ioredis';
import { logger } from './logger';

export const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redisClient.on('connect', () => {
    logger.info('✅ Connected to Redis successfully');
});

redisClient.on('error', (err) => {
    logger.error('❌ Redis Connection Error:', err);
});
