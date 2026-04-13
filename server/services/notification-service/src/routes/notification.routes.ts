import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { NotificationController } from '../controllers/NotificationController';
import config from '../config';

const router = Router();

// Internal Dispatch Route (Secure)
router.post('/dispatch', (req: Request, res: Response, next: NextFunction) => {
    const secret = req.headers['x-internal-secret'];
    if (secret !== config.internalSecret) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
}, (req, res) => container.resolve(NotificationController).dispatchNotification(req, res));


// App Dashboard Routes
router.get('/', (req, res) => container.resolve(NotificationController).getMyNotifications(req, res));
router.patch('/:id/read', (req, res) => container.resolve(NotificationController).markAsRead(req, res));

export default router;
