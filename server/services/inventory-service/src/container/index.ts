import 'reflect-metadata';
import { container } from 'tsyringe';
import { InventoryService } from '../services/InventoryService';
import { FormConfigService } from '../services/FormConfigService';
import { InventoryController } from '../controllers/InventoryController';

// Register services
container.registerSingleton<InventoryService>('InventoryService', InventoryService);
container.registerSingleton<FormConfigService>('FormConfigService', FormConfigService);

// Register controllers
container.registerSingleton(InventoryController);

export { container };
