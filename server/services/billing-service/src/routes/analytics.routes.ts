import { Router } from 'express';
import { container } from 'tsyringe';
import { AnalyticsController } from '../controllers/AnalyticsController';

const router = Router();

router.get('/dashboard', (req, res) => container.resolve(AnalyticsController).getDashboardStats(req as any, res));

export default router;
