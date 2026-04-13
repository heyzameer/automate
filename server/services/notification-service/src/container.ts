import { container } from 'tsyringe';
import { logger } from './utils/logger';
import { NotificationService } from './services/NotificationService';
import { NotificationRepository } from './repositories/NotificationRepository';

// Register Repositories
container.register('NotificationRepository', { useClass: NotificationRepository });

// Register Services
container.register('NotificationService', { useClass: NotificationService });

logger.info('Notification Dependency Container Initialized');

export { container };
