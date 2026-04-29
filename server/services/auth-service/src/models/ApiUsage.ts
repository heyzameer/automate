import mongoose, { Schema, Document } from 'mongoose';

export interface IApiUsage extends Document {
    tenantId: mongoose.Types.ObjectId;
    service: 'bot' | 'gemini' | 'kiosk' | 'inventory' | 'campaign';
    count: number;
    date: string; // YYYY-MM-DD
    lastReset: Date;
}

const apiUsageSchema = new Schema<IApiUsage>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
        },
        service: {
            type: String,
            enum: ['bot', 'gemini', 'kiosk', 'inventory', 'campaign'],
            required: true,
        },
        count: {
            type: Number,
            default: 0,
        },
        date: {
            type: String,
            required: true,
        },
        lastReset: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

apiUsageSchema.index({ tenantId: 1, date: 1, service: 1 }, { unique: true });

export const ApiUsage = mongoose.model<IApiUsage>('ApiUsage', apiUsageSchema);
