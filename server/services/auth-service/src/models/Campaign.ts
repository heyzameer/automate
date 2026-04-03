import mongoose, { Schema, Document } from 'mongoose';

export enum CampaignStatus {
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
    SENDING = 'sending',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export interface ICampaignDocument extends Document {
    tenantId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    messageTemplate: string;
    targetAudience: 'all_leads' | 'new_leads' | 'custom';
    status: CampaignStatus;
    scheduledAt?: Date;
    sentCount: number;
    failedCount: number;
}

const campaignSchema = new Schema<ICampaignDocument>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    messageTemplate: { type: String, required: true },
    targetAudience: { type: String, enum: ['all_leads', 'new_leads', 'custom'], default: 'all_leads' },
    status: { type: String, enum: Object.values(CampaignStatus), default: CampaignStatus.DRAFT },
    scheduledAt: { type: Date },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

export const Campaign = mongoose.model<ICampaignDocument>('Campaign', campaignSchema);
