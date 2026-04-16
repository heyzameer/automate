import { Router, Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
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

// Bot Assignment & Control — PRIORITY ROUTES
router.patch('/tenants/:id/bot-status', (req: Request, res: Response, next: NextFunction) => {
    logger.info(`[ROUTER HIT] PATCH /tenants/${req.params.id}/bot-status`);
    next();
}, superAdminController.toggleBotStatus);

router.post('/tenants/:id/assign-bot', superAdminController.assignBot);

// Tenant Management
router.get(AUTH_ROUTES.SUPER_ADMIN.TENANTS, superAdminController.getTenants);
router.post(AUTH_ROUTES.SUPER_ADMIN.TENANTS, superAdminController.createTenant);
router.delete(AUTH_ROUTES.SUPER_ADMIN.TENANT_BY_ID, superAdminController.deleteTenant);

// Generic tenant update (catch-all PATCH — must be LAST among PATCH /tenants/:id routes)
router.patch(AUTH_ROUTES.SUPER_ADMIN.TENANT_BY_ID, superAdminController.updateTenant);

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

// Payment Requests (Super Admin sends, Partner confirms, Admin views all)
router.get('/payment-requests', superAdminController.getAllPaymentRequests);
router.post('/tenants/:id/payment-request', superAdminController.sendPaymentRequest);
router.patch('/tenants/:id/payment-request/:reqId', superAdminController.updatePaymentRequest);

// Global System Settings
router.get(AUTH_ROUTES.SUPER_ADMIN.SYSTEM_SETTINGS, superAdminController.getSystemSettings);
router.patch(AUTH_ROUTES.SUPER_ADMIN.SYSTEM_SETTINGS, superAdminController.updateSystemSettings);

export default router;
