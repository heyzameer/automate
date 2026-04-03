import { container } from 'tsyringe';
import { InventoryService } from '../services/InventoryService';
import { FormConfigService } from '../services/FormConfigService';

// Register Services
container.register('InventoryService', { useClass: InventoryService });
container.register('FormConfigService', { useClass: FormConfigService });

logger.info('Inventory Dependency Container Initialized');

import { logger } from '../utils/logger';
