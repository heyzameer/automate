import { Document, Types } from 'mongoose';
import { OTPType, OTPStatus } from '../../types';

export interface IOTP extends Document {
    userId: Types.ObjectId;
    type: OTPType;
    code: string;
    status: OTPStatus;
    expiresAt: Date;
    attempts: number;
    maxAttempts: number;
    verifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;

    verify(inputCode: string): { success: boolean; message: string };
    isExpired(): boolean;
    isValid(): boolean;
}
