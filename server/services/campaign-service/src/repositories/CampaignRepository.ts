import { injectable } from 'tsyringe';
import { BaseRepository } from '@carbot/common';
import { Campaign, ICampaignDocument } from '../models/Campaign';
import { ICampaignRepository } from '../interfaces/IRepository/ICampaignRepository';

@injectable()
export class CampaignRepository extends BaseRepository<ICampaignDocument> implements ICampaignRepository {
    constructor() {
        super(Campaign);
    }
}
