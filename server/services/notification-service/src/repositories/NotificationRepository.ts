import { injectable } from 'tsyringe';
import { BaseRepository } from '@carbot/common';
import { AppNotification, IAppNotification } from '../models/AppNotification';
import { INotificationRepository } from '../interfaces/IRepository/INotificationRepository';

@injectable()
export class NotificationRepository extends BaseRepository<IAppNotification> implements INotificationRepository {
    constructor() {
        super(AppNotification);
    }

    async findByTenantAndUser(tenantId: string, userId: string): Promise<IAppNotification[]> {
        return this.find({ tenantId, userId }, { sort: { createdAt: -1 } });
    }
}
