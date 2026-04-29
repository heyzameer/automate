export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    SHOWROOM_ADMIN = 'showroom_admin',
    SHOWROOM_STAFF = 'showroom_staff',
    CUSTOMER = 'customer',
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
    maxSizeLimit: string;
    jwtSecret: string;
    cors: {
        origin: string;
        credentials: boolean;
    };
    database: DatabaseConfig;
    rateLimit: {
        windowMs: number;
        max: number;
    };
    logs: {
        level: string;
        directory: string;
        maxSize: string;
        maxFiles: string;
    };
    cloudinary: {
        cloudName?: string;
        apiKey?: string;
        apiSecret?: string;
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

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: RequestUser;
        }
    }
}
