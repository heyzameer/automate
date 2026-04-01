import { IBaseRepository } from './IBaseRepository';
import { ITenant } from '../IModel/ITenant';

export interface ITenantRepository extends IBaseRepository<ITenant> {
    findBySlug(slug: string): Promise<ITenant | null>;
}
