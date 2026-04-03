import api from '../lib/api';

export interface Lead {
    id: string;
    _id?: string;
    name: string;
    phone: string;
    vehicleId: string;
    preferredDateTime: string;
    status: 'new' | 'contacted' | 'booked' | 'lost' | 'cancelled' | 'rescheduled';
    source: string;
    createdAt?: string;
}

export const leadsService = {
    getLeads: async (tenantId?: string): Promise<Lead[]> => {
        // If tenantId is provided, it's super admin view. Otherwise, it's showroom view (id in token)
        const url = tenantId ? `/super/leads?tenantId=${tenantId}` : '/leads';
        const { data } = await api.get(url);
        return data.data;
    },

    updateLeadStatus: async (leadId: string, status: Lead['status']): Promise<void> => {
        await api.patch(`/leads/${leadId}/status`, { status });
    },

    rescheduleLead: async (leadId: string, newDateTime: string): Promise<void> => {
        await api.patch(`/leads/${leadId}/reschedule`, { preferredDateTime: newDateTime });
    }
};
