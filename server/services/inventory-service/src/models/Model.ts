import mongoose, { Schema, Document } from 'mongoose';

export interface IModel extends Document {
  name: string;
  brand: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ModelSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound index to ensure unique model names per brand
ModelSchema.index({ name: 1, brand: 1 }, { unique: true });

export const Model = mongoose.model<IModel>('Model', ModelSchema);
