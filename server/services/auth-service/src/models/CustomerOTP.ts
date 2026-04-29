import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerOTP extends Document {
    email: string;
    otp: string;
    expiresAt: Date;
}

const customerOTPSchema = new Schema<ICustomerOTP>(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            index: true
        },
        otp: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 } // TTL index
        }
    },
    { timestamps: true }
);

export const CustomerOTP = mongoose.model<ICustomerOTP>('CustomerOTP', customerOTPSchema);
