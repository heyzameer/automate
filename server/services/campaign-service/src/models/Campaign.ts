import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaignDocument extends Document {
  tenantId: string;
  name: string;
  type: 'whatsapp' | 'email';
  audience: 'all' | 'hot' | 'warm' | 'cold' | 'new' | 'customers' | 'remarketing';
  message: string;
  mediaUrl?: string;
  vehicleId?: string;
  vehicleIds?: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledAt?: Date;
  stats: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

const campaignSchema = new Schema<ICampaignDocument>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['whatsapp', 'email'], default: 'whatsapp' },
  audience: { type: String, enum: ['all', 'hot', 'warm', 'cold', 'new', 'customers', 'remarketing'], default: 'all' },
  message: { type: String, required: true },
  mediaUrl: { type: String },
  vehicleId: { type: String },
  vehicleIds: { type: [String], default: [] },
  status: { type: String, enum: ['draft', 'scheduled', 'sending', 'completed', 'failed'], default: 'draft' },
  scheduledAt: { type: Date },
  stats: {
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

export const Campaign = mongoose.model<ICampaignDocument>('Campaign', campaignSchema);
