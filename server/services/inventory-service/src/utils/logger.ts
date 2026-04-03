import { createLogger } from '@carbot/common';
import config from '../config';

export const logger = createLogger('inventory-service', config.logs);
