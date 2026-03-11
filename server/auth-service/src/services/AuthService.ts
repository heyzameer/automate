import { injectable, inject } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { IAuthService } from '../interfaces/IService/IAuthService';
import { IUserRepository } from '../interfaces/IRepository/IUserRepository';
import { IOTPRepository } from '../interfaces/IRepository/IOTPRepository';
import { IUser } from '../interfaces/IModel/IUser';
import { OTPType, JWTPayload, UserRole } from '../types';
import { createError } from '../utils/errorHandler';
import { HttpStatus } from '../enums/HttpStatus';
import { ResponseMessages } from '../enums/ResponseMessages';
import { hashPassword, comparePassword, generateOTP } from '../utils/helpers';
import config from '../config';
import { LoginSession } from '../models/LoginSession';
import { logger } from '../utils/logger';

import { ITenantRepository } from '../interfaces/IRepository/ITenantRepository';

@injectable()
export class AuthService implements IAuthService {
    constructor(
        @inject('UserRepository') private userRepository: IUserRepository,
        @inject('OTPRepository') private otpRepository: IOTPRepository,
        @inject('TenantRepository') private tenantRepository: ITenantRepository
    ) { }

    async register(userData: any): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
        const existingEmail = await this.userRepository.findByEmail(userData.email);
        if (existingEmail) {
            throw createError(ResponseMessages.EMAIL_ALREADY_REGISTERED, HttpStatus.CONFLICT);
        }

        const existingPhone = await this.userRepository.findByPhone(userData.phone);
        if (existingPhone) {
            throw createError(ResponseMessages.PHONE_ALREADY_REGISTERED, HttpStatus.CONFLICT);
        }

        const hashedPassword = await hashPassword(userData.password);

        // Create new user (requires your BaseRepository create method)
        const newUser = await this.userRepository.create({
            ...userData,
            password: hashedPassword,
        });

        const accessToken = this.generateAccessToken(newUser);
        const refreshToken = this.generateRefreshToken(newUser);

        // Save login session
        await LoginSession.create({
            userId: newUser.id,
            refreshToken
        });

        return { user: newUser, accessToken, refreshToken };
    }

    async registerTenant(tenantData: any, adminData: any): Promise<{ user: IUser; tenant: any; accessToken: string; refreshToken: string }> {
        // 1. Check if email/phone already exists
        const existingEmail = await this.userRepository.findByEmail(adminData.email);
        if (existingEmail) {
            throw createError(ResponseMessages.EMAIL_ALREADY_REGISTERED, HttpStatus.CONFLICT);
        }

        // 2. Create Tenant
        const tenant = await this.tenantRepository.create({
            ...tenantData,
            isActive: true, // Should probably be false until activated by super admin, but setting true for now per tasks
        });

        // 3. Create Admin User for this Tenant
        const hashedPassword = await hashPassword(adminData.password);
        const adminUser = await this.userRepository.create({
            ...adminData,
            password: hashedPassword,
            role: UserRole.SHOWROOM_ADMIN,
            tenantId: tenant.id,
            isActive: true,
        });

        const accessToken = this.generateAccessToken(adminUser);
        const refreshToken = this.generateRefreshToken(adminUser);

        await LoginSession.create({
            userId: adminUser.id,
            refreshToken
        });

        return { user: adminUser, tenant, accessToken, refreshToken };
    }

    async login(email: string, password?: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
        const user = await this.userRepository.findByEmail(email);

        if (!user || !user.isActive) {
            throw createError(ResponseMessages.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
        }

        if (password) {
            const isPasswordValid = await comparePassword(password, user.password || '');
            if (!isPasswordValid) {
                throw createError(ResponseMessages.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
            }
        }

        // Check if tenant is active if it's a showroom user
        if (user.tenantId) {
            const tenant = await this.tenantRepository.findById(user.tenantId as any);
            if (!tenant || !tenant.isActive) {
                throw createError('Tenant account is deactivated. Contact support.', HttpStatus.FORBIDDEN);
            }
            if (tenant.expiryDate && new Date() > tenant.expiryDate) {
                throw createError('Subscription expired. Contact support.', HttpStatus.FORBIDDEN);
            }
        }

        await this.userRepository.updateLastLogin(user.id);

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        await LoginSession.create({
            userId: user.id,
            refreshToken
        });

        return { user, accessToken, refreshToken };
    }

    async superLogin(email: string, password?: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
        const user = await this.userRepository.findByEmail(email);

        if (!user || !user.isActive || user.role !== UserRole.SUPER_ADMIN) {
            throw createError(ResponseMessages.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
        }

        if (password) {
            const isPasswordValid = await comparePassword(password, user.password || '');
            if (!isPasswordValid) {
                throw createError(ResponseMessages.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
            }
        }

        await this.userRepository.updateLastLogin(user.id);

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        await LoginSession.create({
            userId: user.id,
            refreshToken
        });

        return { user, accessToken, refreshToken };
    }

    async logout(userId: string): Promise<void> {
        await LoginSession.deleteMany({ userId });
    }

    async socialLogin(user: IUser): Promise<{ accessToken: string; refreshToken: string }> {
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        await LoginSession.create({
            userId: user.id || (user as any)._id,
            refreshToken
        });

        return { accessToken, refreshToken };
    }

    async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
            const session = await LoginSession.findOne({ refreshToken: token, isActive: true });

            if (!session) {
                throw createError('Invalid session', HttpStatus.UNAUTHORIZED);
            }

            const user = await this.userRepository.findById(decoded.userId);
            if (!user || !user.isActive) {
                throw createError(ResponseMessages.USER_NOT_FOUND_OR_INACTIVE, HttpStatus.UNAUTHORIZED);
            }

            const newAccessToken = this.generateAccessToken(user);
            const newRefreshToken = this.generateRefreshToken(user);

            // Invalidate old session, create new
            session.isActive = false;
            await session.save();

            await LoginSession.create({
                userId: user.id,
                refreshToken: newRefreshToken
            });

            return { accessToken: newAccessToken, refreshToken: newRefreshToken };
        } catch (error) {
            throw createError(ResponseMessages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);
        }
    }

    async validateToken(token: string): Promise<any> {
        try {
            return jwt.verify(token, config.jwtSecret);
        } catch (error) {
            throw createError(ResponseMessages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);
        }
    }

    async requestPasswordReset(email: string): Promise<void> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw createError(ResponseMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        // Create and store OTP
        const otpCode = generateOTP();
        await this.otpRepository.createOTP(user.id, OTPType.PASSWORD_RESET, otpCode);

        // Log it for testing/verification in this simulation
        logger.info(`[TEST] OTP for ${email} (PASSWORD_RESET): ${otpCode}`);
    }

    async resetPassword(email: string, otp: string, newPassword?: string): Promise<void> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) throw createError(ResponseMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

        const otpStatus = await this.otpRepository.verifyOTP(user.id, OTPType.PASSWORD_RESET, otp);
        if (!otpStatus.success) {
            throw createError(otpStatus.message, HttpStatus.BAD_REQUEST);
        }

        if (newPassword) {
            const hashed = await hashPassword(newPassword);
            await this.userRepository.update(user.id, { password: hashed });
        }
    }

    async changePassword(userId: string, currentPassword?: string, newPassword?: string): Promise<void> {
        if (!currentPassword || !newPassword) {
            throw createError(ResponseMessages.BOTH_PASSWORDS_REQUIRED, HttpStatus.BAD_REQUEST);
        }

        const user = await this.userRepository.findById(userId);
        if (!user) throw createError(ResponseMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

        const isPasswordValid = await comparePassword(currentPassword, user.password || '');
        if (!isPasswordValid) throw createError(ResponseMessages.CURRENT_PASSWORD_INCORRECT, HttpStatus.BAD_REQUEST);

        const hashed = await hashPassword(newPassword);
        await this.userRepository.update(user.id, { password: hashed });
    }

    async requestOTPVerification(userId: string, type: OTPType): Promise<void> {
        const otpCode = generateOTP();
        await this.otpRepository.createOTP(userId, type, otpCode);
        logger.info(`[TEST] OTP for UserID ${userId} (${type}): ${otpCode}`);
    }

    async verifyOTP(userId: string, type: OTPType, code: string): Promise<void> {
        const verifyResp = await this.otpRepository.verifyOTP(userId, type, code);
        if (!verifyResp.success) {
            throw createError(verifyResp.message, HttpStatus.BAD_REQUEST);
        }
    }

    async generateVerificationOTPs(userId: string, type: OTPType): Promise<void> {
        const otpCode = generateOTP();
        await this.otpRepository.createOTP(userId, type, otpCode);
        logger.info(`[TEST] Generated Verification OTP: ${otpCode}`);
    }

    async getUserFromToken(token: string): Promise<IUser> {
        const decoded = await this.validateToken(token) as JWTPayload;
        const user = await this.userRepository.findById(decoded.userId);
        if (!user || !user.isActive) throw createError(ResponseMessages.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED);
        return user;
    }

    async updateProfile(userId: string, updateData: any): Promise<IUser> {
        const user = await this.userRepository.update(userId, updateData);
        if (!user) throw createError(ResponseMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
        return user;
    }

    generateAccessToken(user: any): string {
        return jwt.sign(
            {
                userId: user.id || user._id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId
            },
            config.jwtSecret,
            { expiresIn: config.jwtExpiration as any }
        );
    }

    generateRefreshToken(user: any): string {
        return jwt.sign(
            {
                userId: user.id || user._id,
                email: user.email,
                tenantId: user.tenantId
            },
            config.jwtSecret,
            { expiresIn: config.jwtRefreshExpiration as any }
        );
    }
}
