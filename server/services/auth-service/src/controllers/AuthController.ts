import { Request, Response, NextFunction } from 'express';
import { OTPType } from '../types';
import { IUser } from '../interfaces/IModel/IUser';
import { Tenant } from '../models/Tenant';
import { asyncHandler } from '../utils/errorHandler';
import { sendError, sendSuccess } from '../utils/response';
import { injectable, inject } from 'tsyringe';
import { IAuthService } from '../interfaces/IService/IAuthService';
import {
    RegisterRequestDto,
    LoginRequestDto,
    RequestPasswordResetDto,
    ResetPasswordDto,
    ChangePasswordDto,
    RequestOTPDto,
    ResendOTPDto,
    VerifyOTPDto,
    ValidateTokenDto
} from '../dtos/auth.dto';
import config from '../config';
import { ResponseMessages } from '../enums/ResponseMessages';
import { HttpStatus } from '../enums/HttpStatus';

@injectable()
export class AuthController {
    constructor(
        @inject('AuthService') private _authService: IAuthService
    ) { }

    register = asyncHandler(async (req: Request<Record<string, unknown>, Record<string, unknown>, RegisterRequestDto>, res: Response, _next: NextFunction) => {
        const { user, accessToken, refreshToken } = await this._authService.register(req.body);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
            maxAge: config.cookieMaxAge,
        });

        sendSuccess(res, ResponseMessages.REGISTER_SUCCESS, {
            user,
            accessToken,
            refreshToken
        }, HttpStatus.CREATED);
    });

    registerTenant = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const { tenantData, adminData } = req.body;
        const { user, tenant, accessToken, refreshToken } = await this._authService.registerTenant(tenantData, adminData);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
            maxAge: config.cookieMaxAge,
        });

        sendSuccess(res, ResponseMessages.REGISTER_SUCCESS, {
            user,
            tenant,
            accessToken,
            refreshToken
        }, HttpStatus.CREATED);
    });

    login = asyncHandler(async (req: Request<Record<string, unknown>, Record<string, unknown>, LoginRequestDto>, res: Response, _next: NextFunction) => {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await this._authService.login(email, password);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
            maxAge: config.cookieMaxAge,
        });

        sendSuccess(res, ResponseMessages.LOGIN_SUCCESS, {
            user,
            accessToken,
            refreshToken
        });
    });

    superLogin = asyncHandler(async (req: Request<Record<string, unknown>, Record<string, unknown>, LoginRequestDto>, res: Response, _next: NextFunction) => {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await this._authService.superLogin(email, password);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
            maxAge: config.cookieMaxAge,
        });

        sendSuccess(res, ResponseMessages.LOGIN_SUCCESS, {
            user,
            accessToken,
            refreshToken
        });
    });

    requestPasswordReset = asyncHandler(async (req: Request<Record<string, unknown>, Record<string, unknown>, RequestPasswordResetDto>, res: Response, _next: NextFunction) => {
        const { email } = req.body;
        await this._authService.requestPasswordReset(email);
        sendSuccess(res, ResponseMessages.PASSWORD_RESET_OTP_SENT);
    });

    resetPassword = asyncHandler(async (req: Request<Record<string, unknown>, Record<string, unknown>, ResetPasswordDto>, res: Response, _next: NextFunction) => {
        const { email, otp, password } = req.body;
        await this._authService.resetPassword(email, otp, password);
        sendSuccess(res, ResponseMessages.PASSWORD_RESET_SUCCESS);
    });

    changePassword = asyncHandler(async (req: Request<Record<string, unknown>, Record<string, unknown>, ChangePasswordDto>, res: Response, _next: NextFunction) => {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user!.userId;
        await this._authService.changePassword(userId, currentPassword, newPassword);
        sendSuccess(res, ResponseMessages.PASSWORD_CHANGED);
    });

    requestOTP = asyncHandler(async (req: Request<Record<string, unknown>, Record<string, unknown>, RequestOTPDto>, res: Response, _next: NextFunction) => {
        const { type } = req.body;
        const userId = req.user!.userId;
        await this._authService.requestOTPVerification(userId, type);
        sendSuccess(res, ResponseMessages.OTP_SENT);
    });

    requestResendOTP = asyncHandler(async (req: Request<Record<string, unknown>, Record<string, unknown>, ResendOTPDto>, res: Response, _next: NextFunction) => {
        const { type } = req.body;
        const userId = req.user!.userId;
        await this._authService.generateVerificationOTPs(userId, type as OTPType);
        sendSuccess(res, ResponseMessages.OTP_SENT);
    });

    verifyOTP = asyncHandler(async (req: Request<Record<string, unknown>, Record<string, unknown>, VerifyOTPDto>, res: Response, _next: NextFunction) => {
        const { code, type } = req.body;
        const userId = req.user!.userId;
        await this._authService.verifyOTP(userId, type, code);
        sendSuccess(res, ResponseMessages.OTP_VERIFIED);
    });

    refreshToken = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return sendError(res, ResponseMessages.INVALID_TOKEN, HttpStatus.BAD_REQUEST);
        }
        const { accessToken: newAccessToken } = await this._authService.refreshToken(refreshToken);
        sendSuccess(res, ResponseMessages.TOKEN_REFRESHED, { accessToken: newAccessToken });
    });

    logout = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const userId = req.user!.userId;
        await this._authService.logout(userId);
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
            path: '/',
        });
        sendSuccess(res, ResponseMessages.LOGOUT_SUCCESS);
    });

    getProfile = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return sendError(res, ResponseMessages.AUTH_TOKEN_REQUIRED, HttpStatus.BAD_REQUEST);
        }
        const user = await this._authService.getUserFromToken(token);
        sendSuccess(res, ResponseMessages.PROFILE_RETRIEVED, { user });
    });

    getMyTenant = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        if (!req.user?.tenantId) {
            return sendError(res, 'No tenant assigned', HttpStatus.FORBIDDEN);
        }
        const tenant = await Tenant.findById(req.user.tenantId);
        if (!tenant) {
            return sendError(res, 'Tenant not found', HttpStatus.NOT_FOUND);
        }
        sendSuccess(res, 'Tenant retrieved', { tenant });
    });

    updateMyTenant = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        if (!req.user?.tenantId) {
            return sendError(res, 'No tenant assigned', HttpStatus.FORBIDDEN);
        }
        const updateData = req.body;
        console.log("UPDATE TENANT REQUEST:", updateData);
        
        const safeUpdateData: Record<string, any> = {};
        if (updateData.whatsappConfig) {
             if (updateData.whatsappConfig.botEnabled !== undefined) safeUpdateData['whatsappConfig.botEnabled'] = updateData.whatsappConfig.botEnabled;
             if (updateData.whatsappConfig.greetingMessage !== undefined) safeUpdateData['whatsappConfig.greetingMessage'] = updateData.whatsappConfig.greetingMessage;
             if (updateData.whatsappConfig.includeGallery !== undefined) safeUpdateData['whatsappConfig.includeGallery'] = updateData.whatsappConfig.includeGallery;
             if (updateData.whatsappConfig.includeSpecs !== undefined) safeUpdateData['whatsappConfig.includeSpecs'] = updateData.whatsappConfig.includeSpecs;
             if (updateData.whatsappConfig.includeLocation !== undefined) safeUpdateData['whatsappConfig.includeLocation'] = updateData.whatsappConfig.includeLocation;
             if (updateData.whatsappConfig.websiteLinkTemplate !== undefined) safeUpdateData['whatsappConfig.websiteLinkTemplate'] = updateData.whatsappConfig.websiteLinkTemplate;
        }
        if (updateData.address !== undefined) {
             safeUpdateData['address'] = updateData.address;
        }
        if (updateData.locationUrl !== undefined) {
             safeUpdateData['locationUrl'] = updateData.locationUrl;
        }
        if (updateData.name !== undefined && updateData.name.trim()) {
             safeUpdateData['name'] = updateData.name.trim();
        }

        const tenant = await Tenant.findByIdAndUpdate(
            req.user.tenantId,
            { $set: safeUpdateData },
            { new: true }
        );

        if (!tenant) {
            return sendError(res, 'Tenant not found', HttpStatus.NOT_FOUND);
        }

        sendSuccess(res, 'Tenant updated', { tenant });
    });

    updateProfile = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const userId = req.user!.userId;
        const updateData = req.body;
        const user = await this._authService.updateProfile(userId, updateData);
        sendSuccess(res, ResponseMessages.PROFILE_UPDATED, { user });
    });

    validateToken = asyncHandler(async (req: Request<Record<string, unknown>, Record<string, unknown>, ValidateTokenDto>, res: Response, _next: NextFunction) => {
        const { token } = req.body;
        const payload = await this._authService.validateToken(token);
        sendSuccess(res, ResponseMessages.TOKEN_VALID, { payload });
    });

    googleCallback = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user as unknown as IUser;
            const { accessToken, refreshToken } = await this._authService.socialLogin(user);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
                maxAge: config.cookieMaxAge,
            });

            const frontendUrl = config.frontendUrl;
            res.redirect(`${frontendUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${user._id || user.id}`);
        } catch (error) {
            next(error);
        }
    };

    getMyPaymentRequests = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return sendError(res, 'No showroom associated', 400);
        const tenant = await Tenant.findById(tenantId).select('paymentRequests name');
        sendSuccess(res, 'Payment requests retrieved', tenant?.paymentRequests || []);
    });

    confirmPayment = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.user?.tenantId;
        const { reqId } = req.params;
        const { screenshotUrl, note } = req.body;
        if (!tenantId) return sendError(res, 'No showroom associated', 400);

        await Tenant.updateOne(
            { _id: tenantId, 'paymentRequests._id': reqId },
            { $set: { 
                'paymentRequests.$.status': 'paid', 
                'paymentRequests.$.screenshotUrl': screenshotUrl,
                'paymentRequests.$.paidAt': new Date(),
                'paymentRequests.$.note': note 
            }}
        );
        sendSuccess(res, 'Payment confirmation submitted');
    });
}
