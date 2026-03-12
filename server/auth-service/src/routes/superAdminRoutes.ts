import { Router } from 'express';
import { SuperAdminController } from '../controllers/SuperAdminController';
import { authenticate, superAuth } from '../middleware/auth';
import { container } from '../container/container';

const router = Router();
const superAdminController = container.resolve(SuperAdminController);

router.use(authenticate);
router.use(superAuth);


router.get('/tenants', superAdminController.getTenants);
router.patch('/tenants/:id', superAdminController.updateTenant);
router.delete('/tenants/:id', superAdminController.deleteTenant);

router.get('/tenants/:tenantId/form-fields', superAdminController.getTenantFormFields);
router.post('/tenants/:tenantId/form-fields', superAdminController.saveFormField);

router.get('/dashboard/stats', superAdminController.getDashboardStats);

export default router;
