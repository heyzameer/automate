import mongoose, { Schema, Document } from 'mongoose';

export enum SubscriptionStatus {
    TRIAL = 'trial',
    ACTIVE = 'active',
    PAST_DUE = 'past_due',
    CANCELED = 'canceled',
    INCOMPLETE = 'incomplete'
}

export interface ISubscriptionDocument extends Document {
    tenantId: mongoose.Types.ObjectId;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    planId: 'basic' | 'pro' | 'enterprise';
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
}

const subscriptionSchema = new Schema<ISubscriptionDocument>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    stripeSubscriptionId: { type: String, unique: true, sparse: true },
    stripeCustomerId: { type: String, index: true },
    planId: { type: String, enum: ['basic', 'pro', 'enterprise'], default: 'basic' },
    status: { type: String, enum: Object.values(SubscriptionStatus), default: SubscriptionStatus.TRIAL },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false }
}, {
    timestamps: true
});

export const Subscription = mongoose.model<ISubscriptionDocument>('Subscription', subscriptionSchema);
