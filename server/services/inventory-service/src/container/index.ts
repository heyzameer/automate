import { container } from 'tsyringe';
import { logger } from '../utils/logger';
import { InventoryService } from '../services/InventoryService';
import { FormConfigService } from '../services/FormConfigService';
import { AIService } from '../services/AIService';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { BrandRepository, ModelRepository, DropdownOptionRepository } from '../repositories/InventoryAuxRepositories';

// Register Repositories
container.register('VehicleRepository', { useClass: VehicleRepository });
container.register('BrandRepository', { useClass: BrandRepository });
container.register('ModelRepository', { useClass: ModelRepository });
container.register('DropdownOptionRepository', { useClass: DropdownOptionRepository });

// Register Services
container.register('AIService', { useClass: AIService });
container.register('InventoryService', { useClass: InventoryService });
container.register('FormConfigService', { useClass: FormConfigService });

logger.info('Inventory Dependency Container Initialized with Repositories');

export { container };
