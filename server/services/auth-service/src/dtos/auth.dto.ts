import { OTPType } from '../types';

export interface RegisterDto {
    user: unknown;
    accessToken: string;
    refreshToken: string;
}

export interface RegisterRequestDto {
    email: string;
    phone: string;
    password?: string;
    fullName: string;
    [key: string]: unknown;
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
