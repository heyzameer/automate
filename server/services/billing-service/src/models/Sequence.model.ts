import mongoose, { Schema, Document } from 'mongoose';

export interface ISequence extends Document {
  tenantId: string;
  type: string;
  currentNumber: number;
}

const SequenceSchema: Schema = new Schema({
  tenantId: { type: String, required: true },
  type: { type: String, required: true },
  currentNumber: { type: Number, default: 0 },
}, { 
  timestamps: false,
  collection: 'sequences'
});

SequenceSchema.index({ tenantId: 1, type: 1 }, { unique: true });

export const SequenceModel = mongoose.model<ISequence>('Sequence', SequenceSchema);
