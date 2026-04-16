import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { container } from '../container';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { UserRole } from '../types';
import publicRoutes from './public.routes';

const router = Router();

// Publicly accessible routes (Showroom / Kiosk)
router.use('/public', publicRoutes);

// Protected routes (Showroom Admin / Super Admin)
router.use(authenticate);

/** 
 * FORM CONFIGURATION (ADMINS)
 */
// Showrooms get the latest dynamic form config
router.get('/config/form', (req, res) => container.resolve(InventoryController).getFormConfig(req, res));

// Global Admin can add/edit fields
router.post('/admin/config/form/fields', 
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), 
    (req, res) => container.resolve(InventoryController).addFormField(req, res)
);

router.put('/admin/config/form/fields/:fieldName/options', 
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), 
    (req, res) => container.resolve(InventoryController).updateFieldOptions(req, res)
);


/**
 * INVENTORY MANAGEMENT (SHOWROOMS)
 */
router.post('/images/upload', upload.array('images', 10), (req, res) => container.resolve(InventoryController).uploadImages(req, res));

router.get('/vehicles', (req, res) => container.resolve(InventoryController).getVehicles(req, res));
router.get('/vehicles/:id', (req, res) => container.resolve(InventoryController).getVehicleById(req, res));
router.post('/vehicles', (req, res) => container.resolve(InventoryController).createVehicle(req, res));
router.patch('/vehicles/:id', (req, res) => container.resolve(InventoryController).updateVehicle(req, res));
router.delete('/vehicles/:id', (req, res) => container.resolve(InventoryController).deleteVehicle(req, res));

/**
 * HIERARCHICAL & GLOBAL DATA
 */
router.get('/brands', (req, res) => container.resolve(InventoryController).getBrands(req, res));
router.get('/brands/:brandId/models', (req, res) => container.resolve(InventoryController).getModels(req, res));
router.get('/dropdown/:fieldName', (req, res) => container.resolve(InventoryController).getDropdownOptions(req, res));
router.get('/next-car-code', (req, res) => container.resolve(InventoryController).getNextCarCode(req, res));
router.get('/vehicles/check-code/:code', (req, res) => container.resolve(InventoryController).checkCarCodeAvailability(req, res));

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Inventory Service' });
});

export default router;
