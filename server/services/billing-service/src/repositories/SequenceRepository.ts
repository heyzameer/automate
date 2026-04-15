import { injectable } from 'tsyringe';
import { MongoBaseRepository } from './MongoBaseRepository';
import { SequenceModel, ISequence } from '../models/Sequence.model';
import { ISequenceRepository } from '../interfaces/IRepository/ISequenceRepository';

@injectable()
export class SequenceRepository extends MongoBaseRepository<ISequence> implements ISequenceRepository {
  constructor() {
    super(SequenceModel);
  }

  async getNextNumber(tenantId: string, type: string): Promise<number> {
    const result = await SequenceModel.findOneAndUpdate(
      { tenantId, type },
      { $inc: { currentNumber: 1 } },
      { upsert: true, new: true }
    ).exec();

    return result!.currentNumber;
  }
}
