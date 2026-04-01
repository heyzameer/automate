import { createLogger } from '@carbot/common';
import config from '../config';

export const logger = createLogger('api-gateway', config.logs);

export default logger;

