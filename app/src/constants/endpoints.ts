export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SUPER_LOGIN: '/auth/super-login',
    REGISTER_TENANT: '/auth/register-tenant',
    MY_TENANT: '/auth/my-tenant',
    PROFILE: '/auth/profile',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  SUPER: {
    TENANTS: '/super/tenants',
    TENANT_BY_ID: (id: string) => `/super/tenants/${id}`,
    SETTINGS: '/super/settings',
    WA_CONFIG: '/super/wa-config',
    STATS: '/super/dashboard/stats',
  },
  VEHICLES: {
    BASE: '/vehicles',
    BY_ID: (id: string) => `/vehicles/${id}`,
  },
  LEADS: {
    BASE: '/leads',
    BY_ID: (id: string) => `/leads/${id}`,
  },
  SETTINGS: {
    SHOWROOM: '/settings/showroom',
    WA: '/settings/whatsapp',
  },
} as const;

