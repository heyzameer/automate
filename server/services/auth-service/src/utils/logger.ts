import { createLogger } from '@carbot/common';
import config from '../config';

export const logger = createLogger('auth-service', config.logs);

export default logger;

