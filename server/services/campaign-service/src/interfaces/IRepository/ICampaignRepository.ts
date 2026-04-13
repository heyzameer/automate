import { ICampaignDocument } from '../../models/Campaign';

export interface ICampaignRepository {
    create(data: any): Promise<ICampaignDocument>;
    findById(id: string): Promise<ICampaignDocument | null>;
    update(id: string, data: any): Promise<ICampaignDocument | null>;
    delete(id: string): Promise<boolean>;
    find(filter: any): Promise<ICampaignDocument[]>;
}
