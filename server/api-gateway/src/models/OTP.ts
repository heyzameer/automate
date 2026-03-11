import mongoose, { Schema } from 'mongoose';
import { OTPType, OTPStatus } from '../types';
import { IOTP } from '../interfaces/IModel/IOTP';

const otpSchema = new Schema<IOTP>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: Object.values(OTPType),
            required: true,
        },
        code: {
            type: String,
            required: true,
            length: 6,
        },
        status: {
            type: String,
            enum: Object.values(OTPStatus),
            default: OTPStatus.PENDING,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        maxAttempts: {
            type: Number,
            default: 3,
        },
        verifiedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                delete ret.code; // Don't expose OTP code in JSON
                return ret;
            },
        },
    }
);

otpSchema.index({ userId: 1 });
otpSchema.index({ type: 1 });
otpSchema.index({ status: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

otpSchema.pre('save', function (next) {
    if (this.isNew && !this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    }
    next();
});

otpSchema.methods.verify = function (inputCode: string) {
    if (this.status !== OTPStatus.PENDING) {
        return { success: false, message: 'OTP is not valid' };
    }

    if (this.expiresAt < new Date()) {
        this.status = OTPStatus.EXPIRED;
        this.save();
        return { success: false, message: 'OTP has expired' };
    }

    if (this.attempts >= this.maxAttempts) {
        this.status = OTPStatus.FAILED;
        this.save();
        return { success: false, message: 'Maximum attempts exceeded' };
    }

    this.attempts += 1;

    if (this.code === inputCode) {
        this.status = OTPStatus.VERIFIED;
        this.verifiedAt = new Date();
        this.save();
        return { success: true, message: 'OTP verified successfully' };
    } else {
        this.save();
        return { success: false, message: 'Invalid OTP code' };
    }
};

otpSchema.methods.isExpired = function () {
    return this.expiresAt < new Date();
};

otpSchema.methods.isValid = function () {
    return this.status === OTPStatus.PENDING && !this.isExpired();
};

export const OTP = mongoose.model<IOTP>('OTP', otpSchema);
