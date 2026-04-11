import { createLogger } from '@carbot/common';

export const logger = createLogger('notification-service', {
    level: process.env.LOG_LEVEL || 'info',
    directory: 'logs',
    maxSize: '20m',
    maxFiles: '14d'
});

export default logger;
