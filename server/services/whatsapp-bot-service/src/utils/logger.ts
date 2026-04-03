import { createLogger } from '@carbot/common';
import config from '../config';

export const logger = createLogger('whatsapp-bot-service', config.logs);
