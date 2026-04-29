export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    SHOWROOM_ADMIN = 'showroom_admin',
    SHOWROOM_STAFF = 'showroom_staff',
    CUSTOMER = 'customer',
}

export enum PlanType {
    NONE = 'none',
    TRIAL = 'trial',
    BASIC = 'basic',
    PRO = 'pro',
    ENTERPRISE = 'enterprise',
    CUSTOM = 'custom',
}

export enum OTPType {
    PHONE_VERIFICATION = 'phone_verification',
    EMAIL_VERIFICATION = 'email_verification',
    PASSWORD_RESET = 'password_reset'
}

export enum OTPStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    EXPIRED = 'expired',
    FAILED = 'failed'
}

export interface PaginationOptions {
    page: number;
    limit: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    tenantId?: string;
    iat?: number;
    exp?: number;
}

export interface DatabaseConfig {
    uri: string;
    options: {
        maxPoolSize: number;
        serverSelectionTimeoutMS: number;
        socketTimeoutMS: number;
        heartbeatFrequencyMS: number;
    };
}

export interface AppConfig {
    port: number;
    env: string;
    jwtSecret: string;
    jwtExpiration: string | number;
    jwtRefreshExpiration: string | number;
    cookieExpiration: number;
    cookieMaxAge: number;

    frontendUrl: string;
    maxSizeLimit: string;
    database: DatabaseConfig;
    cors: {
        origin: string;
        credentials: boolean;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
    otp: {
        expirationMinutes: number;
        maxAttempts: number;
    };
    email: {
        service: string;
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
    logs: {
        level: string;
        directory: string;
        maxSize: string;
        maxFiles: string;
    };
    encryptionSecret: string;
    redis?: {
        host: string;
        port: number;
        password?: string;
    };
    google?: {
        clientId: string;
        clientSecret: string;
        callbackUrl: string;
    };
    internalSecret: string;
}

export interface CustomError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export interface RequestUser {
    userId: string;
    email: string;
    role: UserRole;
    tenantId?: string;
}

export interface RegisterDTO {
    email: string;
    phone: string;
    password?: string;
    fullName: string;
    [key: string]: unknown;
}

export interface TenantRegisterDTO {
    name: string;
    slug?: string;
    [key: string]: unknown;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: RequestUser;
        }
    }
}
