import { injectable } from 'tsyringe';
import { BaseRepository } from '@carbot/common';
import { Sequence, ISequence } from '../models/Sequence';

@injectable()
export class SequenceRepository extends BaseRepository<ISequence> {
  constructor() {
    super(Sequence);
  }

  async getNextNumber(tenantId: string, type: string): Promise<number> {
    const sequence = await Sequence.findOneAndUpdate(
      { tenantId, type },
      { $inc: { currentNumber: 1 } },
      { upsert: true, new: true }
    );
    return sequence.currentNumber;
  }
}
