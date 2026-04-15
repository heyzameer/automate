export enum UserRole {
    CUSTOMER = 'customer',
    PARTNER = 'partner',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin'
}

export interface AppConfig {
    port: number;
    env: string;
    maxSizeLimit: string;
    cors: {
        origin: string;
        credentials: boolean;
    };
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
    services: {
        auth: string;
        inventory: string;
        bot: string;
        campaign: string;
        notification: string;
        analytics: string;
        billing: string;
    };
    jwtSecret: string;
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
