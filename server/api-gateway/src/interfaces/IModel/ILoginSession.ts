import { Document, Types } from 'mongoose';

export interface ILoginSession extends Document {
    userId: Types.ObjectId;
    device?: string;
    browser?: string;
    os?: string;
    ip?: string;
    location?: string;
    refreshToken: string;
    lastActive: Date;
    isActive: boolean;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
}
