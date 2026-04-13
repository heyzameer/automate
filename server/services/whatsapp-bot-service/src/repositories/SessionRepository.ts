import { injectable } from 'tsyringe';
import { BaseRepository } from '@carbot/common';
import { Session, ISessionDocument } from '../models/Session';

@injectable()
export class SessionRepository extends BaseRepository<ISessionDocument> {
    constructor() {
        super(Session);
    }
}
