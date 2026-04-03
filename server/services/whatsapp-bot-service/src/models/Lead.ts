import mongoose, { Schema, Document } from 'mongoose';

export interface ILeadDocument extends Document {
  tenantId: string;
  phone: string;
  name: string;
  vehicleId: string;
  preferredDateTime: string;
  source: 'whatsapp';
  status: 'new' | 'contacted' | 'booked' | 'lost' | 'cancelled' | 'rescheduled';
}

const leadSchema = new Schema<ILeadDocument>({
  tenantId: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  name: { type: String },
  vehicleId: { type: String },
  preferredDateTime: { type: String },
  source: { type: String, default: 'whatsapp' },
  status: { type: String, default: 'new' }
}, {
  timestamps: true
});

// Since leads are specific to this bot service for now, it's on the default connection
export const Lead = mongoose.model<ILeadDocument>('Lead', leadSchema);
