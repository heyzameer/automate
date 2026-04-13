import { injectable } from 'tsyringe';
import { BaseRepository } from '@carbot/common';
import { Lead, ILeadDocument } from '../models/Lead';
import { ILeadRepository } from '../interfaces/IRepository/ILeadRepository';

@injectable()
export class LeadRepository extends BaseRepository<ILeadDocument> implements ILeadRepository {
    constructor() {
        super(Lead);
    }
}
