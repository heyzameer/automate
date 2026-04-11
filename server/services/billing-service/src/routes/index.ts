import { Router } from 'express';
import billingRoutes from './billing.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/billing', billingRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
