import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaignRecipientDocument extends Document {
  campaignId: mongoose.Types.ObjectId;
  tenantId: string;
  phone?: string;
  email?: string;
  name?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  errorMessage?: string;
  lastActivityAt?: Date;
}

const recipientSchema = new Schema<ICampaignRecipientDocument>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  tenantId: { type: String, required: true, index: true },
  phone: { type: String },
  email: { type: String },
  name: { type: String },
  status: { type: String, enum: ['pending', 'sent', 'delivered', 'read', 'failed'], default: 'pending' },
  errorMessage: { type: String },
  lastActivityAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const CampaignRecipient = mongoose.model<ICampaignRecipientDocument>('CampaignRecipient', recipientSchema);
