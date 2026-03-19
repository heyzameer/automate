export const GATEWAY_ROUTES = {
    ROOT: '/',
    HEALTH: '/health',
    AUTH: '/auth',
    SUPER_ADMIN: '/super',
    WILDCARD: '*',
} as const;

export const PROXY_PATHS = {
    AUTH_SERVICE: '/api/v1/auth',
    SUPER_ADMIN_API: '/api/v1/super',
} as const;
