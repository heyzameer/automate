import { injectable, inject } from 'tsyringe';
import { NotificationLog } from '../models/NotificationLog';
import { SocketService } from './SocketService';
import { logger } from '../utils/logger';
import axios from 'axios';
import config from '../config';
import { INotificationRepository } from '../interfaces/IRepository/INotificationRepository';

@injectable()
export class NotificationService {
    private socketService = SocketService.getInstance();

    constructor(
        @inject('NotificationRepository') private notificationRepository: INotificationRepository
    ) {}

    async dispatch(event: string, payload: any) {
        const { tenantId, idempotencyKey, data } = payload;

        // 1. Idempotency Check
        if (idempotencyKey) {
            const exists = await NotificationLog.findOne({ idempotencyKey });
            if (exists) {
                logger.warn(`Duplicate notification detected: ${idempotencyKey}. Skipping.`);
                return;
            }
        }

        try {
            switch (event) {
                case 'appointment.booked':
                    await this.notifyCustomer(tenantId, data.customerPhone, `Your appointment for ${data.carName} is confirmed! 📅`);
                    await this.notifyShowroom(tenantId, 'New Appointment', `Appointment booked for ${data.carName} by ${data.customerName}`, data);
                    break;

                case 'lead.assigned':
                    await this.notifyShowroom(tenantId, 'Lead Assigned', `New lead for ${data.carName} assigned to you.`, data, data.agentId);
                    break;

                case 'lead.scored':
                    if (data.score >= 60) {
                        const displayName = data.customerName || data.phone || 'New Prospect';
                        await this.notifyShowroom(tenantId, '🔥 Hot Lead Detected!', `Lead ${displayName} has a score of ${data.score}. Call now!`, data);
                    }
                    break;

                case 'car.aging_alert':
                    await this.notifyShowroom(tenantId, 'Inventory Aging Alert', `Car ${data.carName} is in stock for ${data.days} days. Consider a price drop.`, data);
                    break;
                
                case 'insurance.expiring':
                    await this.notifyShowroom(tenantId, 'Insurance Expiry 🛡️', `${data.carName} insurance is expiring in ${data.days} days.`, { ...data, type: 'insurance_expiry' });
                    break;
                
                case 'rc.expiring':
                    await this.notifyShowroom(tenantId, 'RC Expiry 📄', `${data.carName} RC is expiring in ${data.days} days.`, { ...data, type: 'rc_expiry' });
                    break;

                default:
                    logger.info(`Unknown event type: ${event}`);
            }

            // Log successful dispatch
            if (idempotencyKey) {
                await NotificationLog.create({
                    idempotencyKey,
                    tenantId,
                    channel: 'app',
                    recipient: 'showroom',
                    type: event,
                    status: 'sent'
                });
            }
        } catch (error: any) {
            logger.error(`Dispatch failed for ${event}:`, error.message);
            // In a real system, push to DLQ here
        }
    }

    async getMyNotifications(tenantId: string, userId: string) {
        return await this.notificationRepository.findByTenantAndUser(tenantId, userId);
    }

    async markAsRead(id: string, tenantId: string) {
        const notification = await this.notificationRepository.findOne({ _id: id, tenantId });
        if (!notification) throw new Error('Notification not found');
        
        notification.isRead = true;
        return await notification.save();
    }

    private async notifyCustomer(tenantId: string, phone: string, message: string) {
        try {
            // Forward to Bot Service for WhatsApp delivery
            await axios.post(`${config.botServiceUrl}/api/v1/bot/internal/broadcast`, {
                tenantId,
                recipients: [phone],
                message
            }, {
                headers: { 'x-internal-secret': config.internalSecret }
            });
            logger.info(`WhatsApp sent to customer: ${phone}`);
        } catch (error: any) {
            logger.error(`WhatsApp notification failed for ${phone}:`, error.message);
        }
    }

    private async notifyShowroom(tenantId: string, title: string, message: string, metadata: any, userId?: string) {
        // 1. Save to DB for history
        const notification = await this.notificationRepository.create({
            tenantId,
            userId,
            type: metadata.type || 'alert',
            title,
            message,
            metadata,
            isRead: false
        });

        // 2. Push in-app alert via Socket
        this.socketService.emitToTenant(tenantId, 'new_notification', notification);
        logger.info(`In-app notification sent to showroom: ${tenantId}`);
    }
}
