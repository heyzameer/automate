export interface IEmailService {
    sendOTP(to: string, otp: string, fullName: string): Promise<void>;
    sendWelcomeEmail(to: string, fullName: string): Promise<void>;
    sendRegistrationPendingEmail(to: string, fullName: string): Promise<void>;
    sendAccountActivatedEmail(to: string, fullName: string): Promise<void>;
}
