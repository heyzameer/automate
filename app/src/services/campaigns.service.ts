import api from "../lib/api";

export interface Campaign {
  _id?: string;
  name: string;
  type: "whatsapp" | "email";
  audience: "all" | "hot" | "warm" | "cold" | "new" | "customers" | "remarketing" | "custom";
  message: string;
  mediaUrl?: string;
  vehicleId?: string;
  vehicleIds?: string[];
  targetLeadIds?: string[];
  status: "draft" | "scheduled" | "sending" | "completed" | "failed";
  scheduledAt?: string;
  stats?: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  createdAt?: string;
}

export const campaignsService = {
  getCampaigns: async (): Promise<Campaign[]> => {
    const { data } = await api.get("/campaigns");
    return data.data;
  },

  createCampaign: async (campaign: Partial<Campaign>): Promise<Campaign> => {
    const { data } = await api.post("/campaigns", campaign);
    return data.data;
  },

  updateCampaign: async (id: string, updates: Partial<Campaign>): Promise<Campaign> => {
    const { data } = await api.patch(`/campaigns/${id}`, updates);
    return data.data;
  },

  executeCampaign: async (id: string): Promise<Campaign> => {
    const { data } = await api.post(`/campaigns/${id}/start`);
    return data.data;
  },

  deleteCampaign: async (id: string): Promise<void> => {
    await api.delete(`/campaigns/${id}`);
  },

  reopenCampaign: async (id: string): Promise<Campaign> => {
    const { data } = await api.post(`/campaigns/${id}/reopen`);
    return data.data;
  },
};
