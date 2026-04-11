export const ROUTES = {
  LANDING: '/',
  ADMIN_LANDING: '/admin',
  ADMIN_LOGIN: '/admin-login',
  HOME: '/app',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  DASHBOARD: {
    HOME: '/dashboard',
    SUBSCRIPTION: '/subscription',
    SETTINGS: '/settings',
    NOTIFICATIONS: '/notifications',
  },
  
  VEHICLES: {
    BASE: '/vehicles',
    ADD: '/vehicles/add',
    DETAIL: (id: string) => `/vehicles/${id}`,
  },
  
  ENQUIRIES: {
    LEADS: '/leads',
  },
  
  AUTOMATION: {
    WHATSAPP: '/automation',
  },

  MARKETING: {
    CAMPAIGNS: '/campaigns',
  },
  
  SUPER_ADMIN: {
    BASE: '/super',
    DASHBOARD: '/super/dashboard',
    SHOWROOMS: '/super/showrooms',
    FORM_BUILDER: '/super/form-builder',
    WA_CONFIG: '/super/wa-config',
    SETTINGS: '/super/settings',
  }
} as const;
