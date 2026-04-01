import mongoose, { Schema, Document } from 'mongoose';

export interface IAccessLog extends Document {
    tenantId?: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    action: string;
    resource: string;
    details: unknown;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

const accessLogSchema = new Schema<IAccessLog>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        action: {
            type: String,
            required: true,
        },
        resource: {
            type: String,
            required: true,
        },
        details: {
            type: Schema.Types.Mixed,
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

accessLogSchema.index({ tenantId: 1, timestamp: -1 });
accessLogSchema.index({ userId: 1, timestamp: -1 });

export const AccessLog = mongoose.model<IAccessLog>('AccessLog', accessLogSchema);
