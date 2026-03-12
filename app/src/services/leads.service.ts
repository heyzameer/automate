import api from '../lib/api';
import { API_ENDPOINTS } from '../constants/endpoints';

export interface Lead {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  vehicle: string;
  date: string;
  status: 'New' | 'Follow Up' | 'Closed' | 'Lost';
  source: 'WhatsApp' | 'Website' | 'Call';
}

export const leadsService = {
  getAll: async (): Promise<Lead[]> => {
    const { data } = await api.get(API_ENDPOINTS.LEADS.BASE);
    return data.data;
  },

  updateStatus: async (id: string, status: Lead['status']): Promise<Lead> => {
    const { data } = await api.patch(`${API_ENDPOINTS.LEADS.BASE}/${id}`, { status });
    return data.data;
  },
};
