import { ITenantRepository } from '../interfaces/IRepository/ITenantRepository';
import { ITenant } from '../interfaces/IModel/ITenant';
import { Tenant } from '../models/Tenant';
import { BaseRepository } from './BaseRepository';
import { injectable } from 'tsyringe';

@injectable()
export class TenantRepository extends BaseRepository<ITenant> implements ITenantRepository {
    constructor() {
        super(Tenant);
    }

    async findBySlug(slug: string): Promise<ITenant | null> {
        return this.model.findOne({ slug });
    }
}
