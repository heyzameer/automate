import nodemailer from 'nodemailer';
import { injectable } from 'tsyringe';
import config from '../config';
import { IEmailService } from '../interfaces/IService/IEmailService';
import { logger } from '../utils/logger';

@injectable()
export class EmailService implements IEmailService {
    private _transporter: nodemailer.Transporter;

    constructor() {
        this._transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: {
                user: config.email.auth.user,
                pass: config.email.auth.pass,
            },
        });

        this._verifyTransporter();
    }

    private async _verifyTransporter() {
        try {
            await this._transporter.verify();
            logger.info('Email transporter verified successfully');
        } catch (error) {
            logger.error('Email transporter verification failed:', error);
        }
    }

    async sendOTP(to: string, otp: string, fullName: string): Promise<void> {
        const mailOptions = {
            from: `"AutoMoto AI" <${config.email.auth.user}>`,
            to,
            subject: 'Your Password Reset OTP - AutoMoto AI',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #4f46e5; text-align: center;">AutoMoto AI</h2>
                    <p>Hello <strong>${fullName}</strong>,</p>
                    <p>You requested a password reset. Use the OTP below to proceed. This code is valid for 10 minutes.</p>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${otp}</span>
                    </div>
                    <p>If you did not request this, please ignore this email or contact support if you have concerns.</p>
                    <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #6b7280; text-align: center;">
                        © ${new Date().getFullYear()} AutoMoto AI. All rights reserved.
                    </p>
                </div>
            `,
        };

        try {
            await this._transporter.sendMail(mailOptions);
            logger.info(`OTP email sent to ${to}`);
        } catch (error) {
            logger.error(`Failed to send OTP email to ${to}:`, error);
            throw new Error('Failed to send email');
        }
    }

    async sendWelcomeEmail(to: string, fullName: string): Promise<void> {
        const mailOptions = {
            from: `"AutoMoto AI" <${config.email.auth.user}>`,
            to,
            subject: 'Welcome to AutoMoto AI!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4f46e5;">Welcome to AutoMoto AI</h2>
                    <p>Hello ${fullName},</p>
                    <p>Your dealership is now registered on the AutoMoto AI platform. We are excited to help you scale your business with automation.</p>
                    <p>You can now log in to your dashboard to manage your inventory and leads.</p>
                    <a href="${config.frontendUrl}/login" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Go to Dashboard</a>
                </div>
            `,
        };

        try {
            await this._transporter.sendMail(mailOptions);
            logger.info(`Welcome email sent to ${to}`);
        } catch (error) {
            logger.error(`Failed to send welcome email to ${to}:`, error);
        }
    }

    async sendRegistrationPendingEmail(to: string, fullName: string): Promise<void> {
        const mailOptions = {
            from: `"AutoMoto AI" <${config.email.auth.user}>`,
            to,
            subject: 'Registration Received - AutoMoto AI',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #4f46e5; text-align: center;">AutoMoto AI</h2>
                    <p>Hello <strong>${fullName}</strong>,</p>
                    <p>Thank you for registering your dealership with <strong>AutoMoto AI</strong>.</p>
                    <p>Your application is currently being reviewed by our administrative team. We will verify your credentials and activate your account within 12-24 business hours.</p>
                    <p>You will receive another email as soon as your digital showroom is ready for launch.</p>
                    <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #6b7280; text-align: center;">
                        If you have any questions, reply to this email to contact our partner support team.
                    </p>
                </div>
            `,
        };

        try {
            await this._transporter.sendMail(mailOptions);
            logger.info(`Registration pending email sent to ${to}`);
        } catch (error) {
            logger.error(`Failed to send pending email to ${to}:`, error);
        }
    }

    async sendAccountActivatedEmail(to: string, fullName: string): Promise<void> {
        const mailOptions = {
            from: `"AutoMoto AI" <${config.email.auth.user}>`,
            to,
            subject: 'Account Activated - Welcome to AutoMoto AI!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #4f46e5; text-align: center;">Welcome to AutoMoto AI</h2>
                    <p>Hello <strong>${fullName}</strong>,</p>
                    <p>Your dealership is now registered and <strong>fully activated</strong> on the AutoMoto AI platform. We are excited to help you scale your business with automation.</p>
                    <p>You can now log in to your dashboard to manage your inventory, set up your WhatsApp bot, and track your leads.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${config.frontendUrl}/login" style="display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a>
                    </div>
                    <p>Happy selling!</p>
                    <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #6b7280; text-align: center;">
                        © ${new Date().getFullYear()} AutoMoto AI. All rights reserved.
                    </p>
                </div>
            `,
        };

        try {
            await this._transporter.sendMail(mailOptions);
            logger.info(`Account activation email sent to ${to}`);
        } catch (error) {
            logger.error(`Failed to send activation email to ${to}:`, error);
        }
    }
}
