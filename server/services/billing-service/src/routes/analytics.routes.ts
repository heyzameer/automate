import { Router } from 'express';
import { container } from 'tsyringe';
import { AnalyticsController } from '../controllers/AnalyticsController';

const router = Router();
const controller = container.resolve(AnalyticsController);

router.get('/dashboard', controller.getDashboardStats.bind(controller));

export default router;
