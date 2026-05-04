import rateLimit from 'express-rate-limit';
import config from '../config';

export const generalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Increased to 100 attempts per window
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
        timestamp: new Date(),
    },
    validate: false,
});

export const otpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Increased to 20 attempts per minute
    message: {
        success: false,
        message: 'Too many OTP requests, please try again later.',
        timestamp: new Date(),
    },
    validate: { trustProxy: false },
});
