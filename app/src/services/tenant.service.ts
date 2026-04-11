import api from '../lib/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { Tenant, ApiResponse } from '../types';

export interface TenantPayload {
  name: string;
  slug?: string;
  plan: string;
  limits?: {
    maxCars: number;
    maxLeads: number;
  };
  expiryDate: string;
}

export const tenantService = {
  getAllTenants: async (): Promise<Tenant[]> => {
    const { data } = await api.get<ApiResponse<Tenant[]>>(API_ENDPOINTS.SUPER.TENANTS);
    return data.data;
  },

  updateTenantPlan: async (id: string, payload: Partial<TenantPayload>): Promise<void> => {
    await api.patch(API_ENDPOINTS.SUPER.TENANT_BY_ID(id), payload);
  },

  updateTenantStatus: async (id: string, isActive: boolean): Promise<void> => {
    await api.patch(API_ENDPOINTS.SUPER.TENANT_BY_ID(id), { isActive });
  },

  registerTenant: async (payload: Record<string, unknown>): Promise<void> => {
    await api.post(API_ENDPOINTS.AUTH.REGISTER_TENANT, payload);
  },

  assignBotToTenant: async (id: string, botForm: any): Promise<void> => {
    await api.post(`${API_ENDPOINTS.SUPER.TENANTS}/${id}/assign-bot`, botForm);
  },

  getMyTenant: async (): Promise<Tenant> => {
    const { data } = await api.get<ApiResponse<Tenant>>(API_ENDPOINTS.AUTH.MY_TENANT);
    return data.data;
  },

  updateMyTenant: async (payload: Partial<Tenant>): Promise<void> => {
    await api.patch(API_ENDPOINTS.AUTH.MY_TENANT, payload);
  }
};
