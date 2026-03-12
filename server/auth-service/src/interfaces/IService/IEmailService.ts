export interface IEmailService {
    sendOTP(to: string, otp: string, fullName: string): Promise<void>;
    sendWelcomeEmail(to: string, fullName: string): Promise<void>;
}
