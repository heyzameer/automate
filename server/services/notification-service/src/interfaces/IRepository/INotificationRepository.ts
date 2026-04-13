import { IAppNotification } from '../../models/AppNotification';
import { IBaseRepository } from '@carbot/common';

export interface INotificationRepository extends IBaseRepository<IAppNotification> {
    findByTenantAndUser(tenantId: string, userId: string): Promise<IAppNotification[]>;
}
