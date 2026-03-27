import { createLogger, createHttpLogger } from '@carbot/logger';
import config from '../config';

export const logger = createLogger({
    serviceName: 'api-gateway',
    nodeEnv: config.env,
    level: config.logs?.level || 'info',
});

export const httpLogger = createHttpLogger(logger);

export default logger;
