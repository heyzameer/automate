import api from '../lib/api';

export type LeadStage = 'New' | 'Contacted' | 'Test Drive' | 'Negotiation' | 'Closed' | 'Lost';
export type LeadPriority = 'Cold' | 'Warm' | 'Hot';

export interface ICallLog {
    date: string;
    note: string;
    agent?: string;
}

export interface Lead {
    id: string;
    _id?: string;
    name: string;
    phone: string;
    vehicleId: string;
    preferredDateTime: string;
    status: 'new' | 'contacted' | 'booked' | 'lost' | 'cancelled' | 'rescheduled' | 'completed' | 'noshow';
    source: string;
    stage: LeadStage;
    score: number;
    priority: LeadPriority;
    assignedTo?: string;
    followUpDate?: string;
    callLogs: ICallLog[];
    createdAt?: string;
    lastActivity?: string;
}

export const leadsService = {
    getLeads: async (tenantId?: string): Promise<Lead[]> => {
        // If tenantId is provided, it's super admin view. Otherwise, it's showroom view (id in token)
        const url = tenantId ? `/super/leads?tenantId=${tenantId}` : '/bot/leads';
        const { data } = await api.get(url);
        return data.data;
    },

    updateLead: async (leadId: string, updateData: Partial<Lead>): Promise<Lead> => {
        const { data } = await api.patch(`/bot/leads/${leadId}`, updateData);
        return data.data;
    },

    addCallLog: async (leadId: string, note: string, agent?: string): Promise<Lead> => {
        const { data } = await api.post(`/bot/leads/${leadId}/call-log`, { note, agent });
        return data.data;
    },

    getQRCode: async (carCode: string): Promise<string> => {
        const { data } = await api.get(`/bot/leads/qr/${carCode}`);
        return data.data;
    },

    getLeadsByVehicle: async (vehicleId: string): Promise<Lead[]> => {
        const { data } = await api.get(`/bot/leads/vehicle/${vehicleId}`);
        return data.data;
    }
};
