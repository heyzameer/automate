import { injectable } from 'tsyringe';
import { OTPType, OTPStatus } from '../types';
import mongoose from 'mongoose';
import { IOTPRepository } from '../interfaces/IRepository/IOTPRepository';
import { IOTP } from '../interfaces/IModel/IOTP';
import { OTP } from '../models/OTP';

@injectable()
export class OTPRepository implements IOTPRepository {

    async findValidOTP(userId: string, type: OTPType, code: string): Promise<IOTP | null> {
        return OTP.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            type,
            code,
            status: OTPStatus.PENDING,
            expiresAt: { $gt: new Date() },
        }).exec();
    }

    async createOTP(
        userId: string,
        type: OTPType,
        code: string,
        orderId?: string,
        expirationMinutes: number = 10
    ): Promise<IOTP> {
        const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
        const newOTP = new OTP({
            userId: new mongoose.Types.ObjectId(userId),
            type,
            code,
            expiresAt,
        });
        return newOTP.save();
    }

    async verifyOTP(userId: string, type: OTPType, code: string): Promise<{ success: boolean; message: string }> {
        const otp = await this.findValidOTP(userId, type, code);
        if (!otp) {
            return { success: false, message: 'Invalid or expired OTP' };
        }
        return otp.verify(code);
    }

    async cleanupExpiredOTPs(): Promise<number> {
        // TTL index handles standard cleanup, this is for forced manual cleanup
        const result = await OTP.deleteMany({ expiresAt: { $lt: new Date() } });
        return result.deletedCount || 0;
    }

    async getOTPAttempts(userId: string, type: OTPType): Promise<number> {
        const otp = await OTP.findOne({ userId: new mongoose.Types.ObjectId(userId), type }).sort({ createdAt: -1 });
        return otp ? otp.attempts : 0;
    }
}
