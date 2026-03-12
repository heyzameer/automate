export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  DASHBOARD: {
    HOME: '/dashboard',
    SUBSCRIPTION: '/subscription',
    SETTINGS: '/settings',
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
  
  SUPER_ADMIN: {
    BASE: '/super',
    DASHBOARD: '/super/dashboard',
    SHOWROOMS: '/super/showrooms',
    FORM_BUILDER: '/super/form-builder',
    WA_CONFIG: '/super/wa-config',
    SETTINGS: '/super/settings',
  }
} as const;
