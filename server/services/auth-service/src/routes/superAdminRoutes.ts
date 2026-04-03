import { Router } from 'express';
import { SuperAdminController } from '../controllers/SuperAdminController';
import { CampaignController } from '../controllers/CampaignController';
import { BillingController } from '../controllers/BillingController';
import { authenticate, superAuth } from '../middleware/auth';
import { container } from '../container/container';
import { AUTH_ROUTES } from '../constants/routes';

const router = Router();
const superAdminController = container.resolve(SuperAdminController);
const billingController = container.resolve(BillingController);
const campaignController = container.resolve(CampaignController);

router.use(authenticate);
router.use(superAuth);

// Tenant Management
router.get(AUTH_ROUTES.SUPER_ADMIN.TENANTS, superAdminController.getTenants);
router.post(AUTH_ROUTES.SUPER_ADMIN.TENANTS, superAdminController.createTenant);
router.patch(AUTH_ROUTES.SUPER_ADMIN.TENANT_BY_ID, superAdminController.updateTenant);
router.delete(AUTH_ROUTES.SUPER_ADMIN.TENANT_BY_ID, superAdminController.deleteTenant);

// Bot Assignment
router.post('/tenants/:id/assign-bot', superAdminController.assignBot);

// Global CRM leads for Super Admin
router.get('/leads', superAdminController.getLeads);

// Billing & Revenue
router.get('/billing/subscriptions', billingController.getSubscriptions);
router.patch('/billing/subscriptions/:id', billingController.updateSubscription);
router.get('/billing/stats', billingController.getBillingDashboard);

// Global Campaigns (Super Admin oversight)
router.get('/campaigns', campaignController.getCampaigns);
router.post('/campaigns', campaignController.createCampaign);

// Form Fields & Stats
router.get(AUTH_ROUTES.SUPER_ADMIN.TENANT_FORM_FIELDS, superAdminController.getTenantFormFields);
router.post(AUTH_ROUTES.SUPER_ADMIN.TENANT_FORM_FIELDS, superAdminController.saveFormField);
router.get(AUTH_ROUTES.SUPER_ADMIN.DASHBOARD_STATS, superAdminController.getDashboardStats);

export default router;
