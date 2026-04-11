import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { NotificationController } from '../controllers/NotificationController';

const router = Router();
const controller = container.resolve(NotificationController);

// Internal Dispatch Route (Secure)
router.post('/dispatch', (req: Request, res: Response, next: NextFunction) => {
    const secret = req.headers['x-internal-secret'];
    if (secret !== 'carbot-internal-super-secret') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
}, controller.dispatchNotification.bind(controller));

// App Dashboard Routes
router.get('/', controller.getMyNotifications.bind(controller));
router.patch('/:id/read', controller.markAsRead.bind(controller));

export default router;
