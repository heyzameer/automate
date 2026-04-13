import { injectable } from 'tsyringe';
import { BaseRepository } from '@carbot/common';
import { Tenant, ITenantDocument } from '../models/Tenant';
import { ITenantRepository } from '../interfaces/IRepository/ITenantRepository';

@injectable()
export class TenantRepository extends BaseRepository<ITenantDocument> implements ITenantRepository {
    constructor() {
        super(Tenant);
    }
}
