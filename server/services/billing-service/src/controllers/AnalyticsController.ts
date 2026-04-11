import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { AnalyticsService } from '../services/AnalyticsService';

@injectable()
export class AnalyticsController {
    constructor(private analyticsService: AnalyticsService) {}

    async getDashboardStats(req: Request, res: Response) {
        try {
            const tenantId = req.headers['x-tenant-id'] as string;
            
            const [revenue, funnel, inventory, recentActivity] = await Promise.all([
                this.analyticsService.getRevenueStats(tenantId),
                this.analyticsService.getFunnelStats(tenantId),
                this.analyticsService.getInventoryIntelligence(tenantId),
                this.analyticsService.getRecentActivity(tenantId)
            ]);

            res.json({
                success: true,
                data: { revenue, funnel, inventory, recentActivity, updatedAt: new Date() }
            });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
