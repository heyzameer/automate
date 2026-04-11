import { Router } from 'express';
import { container } from 'tsyringe';
import { LeadController } from '../controllers/LeadController';

const router = Router();
const leadController = container.resolve(LeadController);

/**
 * Public endpoint for capturing leads from Website, FB Ads, etc.
 * Expects tenantId in body or query.
 */
router.post('/capture', leadController.capturePublicLead.bind(leadController));
router.get('/scan/:carCode', leadController.renderScanPage.bind(leadController));

export default router;
