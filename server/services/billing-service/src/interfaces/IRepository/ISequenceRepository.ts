import { ISequence } from '../../models/Sequence.model';
import { IMongoBaseRepository } from '../../repositories/MongoBaseRepository';

export interface ISequenceRepository extends IMongoBaseRepository<ISequence> {
    getNextNumber(tenantId: string, type: string): Promise<number>;
}
