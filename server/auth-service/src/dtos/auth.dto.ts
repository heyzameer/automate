import { OTPType } from '../types';

export interface RegisterDto {
    user: any;
    accessToken: string;
    refreshToken: string;
}

export interface RegisterRequestDto {
    [key: string]: any;
}

export interface LoginRequestDto {
    email: string;
    password?: string;
}

export interface RequestPasswordResetDto {
    email: string;
}

export interface ResetPasswordDto {
    email: string;
    otp: string;
    password?: string;
}

export interface ChangePasswordDto {
    currentPassword?: string;
    newPassword?: string;
}

export interface RequestOTPDto {
    type: OTPType;
}

export interface ResendOTPDto {
    type: OTPType;
    email: string;
}

export interface VerifyOTPDto {
    code: string;
    type: OTPType;
}

export interface ValidateTokenDto {
    token: string;
}
