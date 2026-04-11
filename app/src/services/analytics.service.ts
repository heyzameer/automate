import api from "../lib/api";

export interface DashboardStats {
    revenue: {
        totalRevenue: number;
        monthlyGrowth: number;
        salesCount: number;
        avgSalePrice: number;
    };
    funnel: {
        stages: Array<{ stage: string; count: number }>;
        conversionRate: number;
    };
    inventory: {
        avgDaysInStock: number;
        slowMovingCount: number;
        brandDistribution: Array<{ brand: string; count: number }>;
    };
    recentActivity: Array<{
        id: string;
        title: string;
        time: string;
        type: 'lead' | 'sold' | 'listing';
    }>;
    updatedAt: string;
}

export const analyticsService = {
    getDashboardStats: async (): Promise<DashboardStats> => {
        const { data } = await api.get("/analytics/dashboard");
        return data.data;
    }
};
