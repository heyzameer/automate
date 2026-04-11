import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { container } from '../container';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { UserRole } from '../types';
import publicRoutes from './public.routes';

const router = Router();
const controller = container.resolve(InventoryController);

// Publicly accessible routes (Showroom / Kiosk)
router.use('/public', publicRoutes);

// Protected routes (Showroom Admin / Super Admin)
router.use(authenticate);

/** 
 * FORM CONFIGURATION (ADMINS)
 */
// Showrooms get the latest dynamic form config
router.get('/config/form', controller.getFormConfig.bind(controller));

// Global Admin can add/edit fields
router.post('/admin/config/form/fields', 
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), 
    controller.addFormField.bind(controller)
);

router.put('/admin/config/form/fields/:fieldName/options', 
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), 
    controller.updateFieldOptions.bind(controller)
);


/**
 * INVENTORY MANAGEMENT (SHOWROOMS)
 */
router.post('/images/upload', upload.array('images', 10), controller.uploadImages.bind(controller));

router.get('/vehicles', controller.getVehicles.bind(controller));
router.get('/vehicles/:id', controller.getVehicleById.bind(controller));
router.post('/vehicles', controller.createVehicle.bind(controller));
router.patch('/vehicles/:id', controller.updateVehicle.bind(controller));
router.delete('/vehicles/:id', controller.deleteVehicle.bind(controller));

/**
 * HIERARCHICAL & GLOBAL DATA
 */
router.get('/brands', controller.getBrands.bind(controller));
router.get('/brands/:brandId/models', controller.getModels.bind(controller));
router.get('/dropdown/:fieldName', controller.getDropdownOptions.bind(controller));
router.get('/next-car-code', controller.getNextCarCode.bind(controller));

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Inventory Service' });
});

export default router;
