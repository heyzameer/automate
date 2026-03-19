import { Request, Response, NextFunction } from 'express';
import { OTPType } from '../types';
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

    register = asyncHandler(async (req: Request<any, any, RegisterRequestDto>, res: Response, _next: NextFunction) => {
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

    login = asyncHandler(async (req: Request<any, any, LoginRequestDto>, res: Response, _next: NextFunction) => {
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

    requestPasswordReset = asyncHandler(async (req: Request<any, any, RequestPasswordResetDto>, res: Response, _next: NextFunction) => {
        const { email } = req.body;
        await this._authService.requestPasswordReset(email);
        sendSuccess(res, ResponseMessages.PASSWORD_RESET_OTP_SENT);
    });

    resetPassword = asyncHandler(async (req: Request<any, any, ResetPasswordDto>, res: Response, _next: NextFunction) => {
        const { email, otp, password } = req.body;
        await this._authService.resetPassword(email, otp, password);
        sendSuccess(res, ResponseMessages.PASSWORD_RESET_SUCCESS);
    });

    changePassword = asyncHandler(async (req: Request<any, any, ChangePasswordDto>, res: Response, _next: NextFunction) => {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user!.userId;
        await this._authService.changePassword(userId, currentPassword, newPassword);
        sendSuccess(res, ResponseMessages.PASSWORD_CHANGED);
    });

    requestOTP = asyncHandler(async (req: Request<any, any, RequestOTPDto>, res: Response, _next: NextFunction) => {
        const { type } = req.body;
        const userId = req.user!.userId;
        await this._authService.requestOTPVerification(userId, type);
        sendSuccess(res, ResponseMessages.OTP_SENT);
    });

    requestResendOTP = asyncHandler(async (req: Request<any, any, ResendOTPDto>, res: Response, _next: NextFunction) => {
        const { type } = req.body;
        const userId = req.user!.userId;
        await this._authService.generateVerificationOTPs(userId, type as OTPType);
        sendSuccess(res, ResponseMessages.OTP_SENT);
    });

    verifyOTP = asyncHandler(async (req: Request<any, any, VerifyOTPDto>, res: Response, _next: NextFunction) => {
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

    updateProfile = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const userId = req.user!.userId;
        const updateData = req.body;
        const user = await this._authService.updateProfile(userId, updateData);
        sendSuccess(res, ResponseMessages.PROFILE_UPDATED, { user });
    });

    validateToken = asyncHandler(async (req: Request<any, any, ValidateTokenDto>, res: Response, _next: NextFunction) => {
        const { token } = req.body;
        const payload = await this._authService.validateToken(token);
        sendSuccess(res, ResponseMessages.TOKEN_VALID, { payload });
    });

    googleCallback = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user as unknown;
            const { accessToken, refreshToken } = await this._authService.socialLogin(user);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
                maxAge: config.cookieMaxAge,
            });

            const frontendUrl = config.frontendUrl;
            res.redirect(`${frontendUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${user._id}`);
        } catch (error) {
            next(error);
        }
    };
}
