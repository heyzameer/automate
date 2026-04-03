import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  category: 'regular' | 'luxury';
  createdAt: Date;
}

const BrandSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  category: { type: String, enum: ['regular', 'luxury'], default: 'regular' },
  createdAt: { type: Date, default: Date.now }
});

export const Brand = mongoose.model<IBrand>('Brand', BrandSchema);
