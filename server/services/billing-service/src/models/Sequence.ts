import mongoose, { Schema, Document } from 'mongoose';

export interface ISequence extends Document {
  tenantId: string;
  type: string; // 'invoice', 'delivery_note', etc.
  currentNumber: number;
}

const sequenceSchema = new Schema<ISequence>({
  tenantId: { type: String, required: true },
  type: { type: String, required: true },
  currentNumber: { type: Number, default: 0 }
});

sequenceSchema.index({ tenantId: 1, type: 1 }, { unique: true });

export const Sequence = mongoose.model<ISequence>('Sequence', sequenceSchema);
