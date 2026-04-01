import { OTPType, UserRole, RegisterDTO, TenantRegisterDTO, JWTPayload } from '../../types';
import { IUser } from '../IModel/IUser';
import { ITenant } from '../IModel/ITenant';

export interface IAuthService {
    register(userData: RegisterDTO): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
    registerTenant(tenantData: TenantRegisterDTO, adminData: RegisterDTO): Promise<{ user: IUser; tenant: ITenant; accessToken: string; refreshToken: string }>;
    login(email: string, password?: string, method?: 'password' | 'otp'): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
    superLogin(email: string, password?: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
    logout(userId: string): Promise<void>;
    socialLogin(user: IUser): Promise<{ accessToken: string; refreshToken: string }>;

    refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }>;
    validateToken(token: string): Promise<JWTPayload>;

    requestPasswordReset(email: string): Promise<void>;
    resetPassword(email: string, otp: string, newPassword?: string): Promise<void>;
    changePassword(userId: string, currentPassword?: string, newPassword?: string): Promise<void>;

    requestOTPVerification(userId: string, type: OTPType): Promise<void>;
    verifyOTP(userId: string, type: OTPType, code: string): Promise<void>;
    generateVerificationOTPs(userId: string, type: OTPType): Promise<void>;

    getUserFromToken(token: string): Promise<IUser>;
    updateProfile(userId: string, updateData: unknown): Promise<IUser>;

    generateAccessToken(user: IUser): string;
    generateRefreshToken(user: IUser): string;
}
