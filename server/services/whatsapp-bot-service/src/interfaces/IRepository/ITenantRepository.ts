import { ITenantDocument } from '../../models/Tenant';

export interface ITenantRepository {
    findById(id: string): Promise<ITenantDocument | null>;
    findOne(query: any): Promise<ITenantDocument | null>;
    update(id: string, data: any): Promise<ITenantDocument | null>;
}
