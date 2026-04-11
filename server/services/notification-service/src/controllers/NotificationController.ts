import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { NotificationService } from '../services/NotificationService';
import { AppNotification } from '../models/AppNotification';

@injectable()
export class NotificationController {
    constructor(private notificationService: NotificationService) {}

    async dispatchNotification(req: Request, res: Response) {
        try {
            const { event, payload } = req.body;
            await this.notificationService.dispatch(event, payload);
            res.json({ success: true, message: 'Dispatched successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getMyNotifications(req: Request, res: Response) {
        try {
            const tenantId = req.headers['x-tenant-id'] as string;
            const notifications = await AppNotification.find({ tenantId })
                .sort({ createdAt: -1 })
                .limit(50);
            res.json({ success: true, data: notifications });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async markAsRead(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await AppNotification.findByIdAndUpdate(id, { isRead: true });
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
