import mongoose, { Schema } from 'mongoose';
import { ILoginSession } from '../interfaces/IModel/ILoginSession';

const loginSessionSchema = new Schema<ILoginSession>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        device: { type: String, default: 'Unknown Device' },
        browser: { type: String, default: 'Unknown Browser' },
        os: { type: String, default: 'Unknown OS' },
        ip: { type: String },
        location: { type: String, default: 'Unknown Location' },
        refreshToken: { type: String, required: true },
        lastActive: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true },
        userAgent: { type: String },
    },
    { timestamps: true }
);

loginSessionSchema.index({ userId: 1 });
loginSessionSchema.index({ refreshToken: 1 });

export const LoginSession = mongoose.model<ILoginSession>('LoginSession', loginSessionSchema);
