import { Router } from 'express';
import { SuperAdminController } from '../controllers/SuperAdminController';
import { authenticate } from '../middleware/auth';
import { container } from '../container/container';
// import { superAuth } from '@carbot/shared'; // We'll use local middleware for now since shared might not be linked yet

// Local superAuth for now
const superAuth = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'super_admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Super admin access required' });
};

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
