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
            if (!tenantId) return res.status(403).json({ success: false, message: 'Tenant ID required' });
            
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
            const tenantId = req.headers['x-tenant-id'] as string;
            if (!tenantId) return res.status(403).json({ success: false, message: 'Tenant ID required' });

            const notification = await AppNotification.findOneAndUpdate(
                { _id: id, tenantId }, 
                { isRead: true },
                { new: true }
            );
            
            if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
            
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
