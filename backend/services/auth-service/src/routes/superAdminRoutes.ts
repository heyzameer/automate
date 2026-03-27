import { Router } from 'express';
import { SuperAdminController } from '../controllers/SuperAdminController';
import { authenticate, superAuth } from '../middleware/auth';
import { container } from '../container/container';
import { AUTH_ROUTES } from '../constants/routes';

const router = Router();
const superAdminController = container.resolve(SuperAdminController);

router.use(authenticate);
router.use(superAuth);


router.get(AUTH_ROUTES.SUPER_ADMIN.TENANTS, superAdminController.getTenants);
router.patch(AUTH_ROUTES.SUPER_ADMIN.TENANT_BY_ID, superAdminController.updateTenant);
router.delete(AUTH_ROUTES.SUPER_ADMIN.TENANT_BY_ID, superAdminController.deleteTenant);

router.get(AUTH_ROUTES.SUPER_ADMIN.TENANT_FORM_FIELDS, superAdminController.getTenantFormFields);
router.post(AUTH_ROUTES.SUPER_ADMIN.TENANT_FORM_FIELDS, superAdminController.saveFormField);

router.get(AUTH_ROUTES.SUPER_ADMIN.DASHBOARD_STATS, superAdminController.getDashboardStats);

export default router;
