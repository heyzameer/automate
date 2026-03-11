import { OTPType, UserRole } from '../../types';
import { IUser } from '../IModel/IUser';

export interface IAuthService {
    register(userData: any): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
    login(email: string, password?: string, method?: 'password' | 'otp'): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
    logout(userId: string): Promise<void>;
    socialLogin(user: IUser): Promise<{ accessToken: string; refreshToken: string }>;

    refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }>;
    validateToken(token: string): Promise<any>;

    requestPasswordReset(email: string): Promise<void>;
    resetPassword(email: string, otp: string, newPassword?: string): Promise<void>;
    changePassword(userId: string, currentPassword?: string, newPassword?: string): Promise<void>;

    requestOTPVerification(userId: string, type: OTPType): Promise<void>;
    verifyOTP(userId: string, type: OTPType, code: string): Promise<void>;
    generateVerificationOTPs(userId: string, type: OTPType): Promise<void>;

    getUserFromToken(token: string): Promise<IUser>;
    updateProfile(userId: string, updateData: any): Promise<IUser>;

    generateAccessToken(user: any): string;
    generateRefreshToken(user: any): string;
}
