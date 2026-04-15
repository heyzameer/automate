import { injectable } from 'tsyringe';
import { logger } from '../utils/logger';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { HttpClient } from '@carbot/common';
import config from '../config';

@injectable()
export class AnalyticsService {
    private botClient: HttpClient;
    private inventoryClient: HttpClient;

    constructor(private invoiceRepository: InvoiceRepository) {
        this.botClient = new HttpClient({
            baseURL: config.botServiceUrl,
            timeout: 5000,
            circuitBreakerOptions: { errorThresholdPercentage: 50, resetTimeout: 10000 }
        });
        this.inventoryClient = new HttpClient({
            baseURL: config.inventoryServiceUrl,
            timeout: 5000,
            circuitBreakerOptions: { errorThresholdPercentage: 50, resetTimeout: 10000 }
        });
    }
    
    // Revenue Stats (Implemented from Real Billing Logic)
    async getRevenueStats(tenantId: string) {
        try {
            const invoices = await this.invoiceRepository.find({ 
                tenantId, 
                status: 'paid' as any
            });

            const totalRevenue = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);
            const salesCount = invoices.length;
            const avgSalePrice = salesCount > 0 ? totalRevenue / salesCount : 0;

            // Simple mock for growth for now, ideally compare with last month
            return {
                totalRevenue,
                monthlyGrowth: 0, // Placeholder for actual growth calculation
                salesCount,
                avgSalePrice
            };
        } catch (error: any) {
            logger.error('Error fetching revenue stats:', error.message);
            return { totalRevenue: 0, monthlyGrowth: 0, salesCount: 0, avgSalePrice: 0 };
        }
    }


    // Funnel Stats (Cross-service call to Bot service)
    async getFunnelStats(tenantId: string) {
        try {
            const response = await this.botClient.get(`/api/v1/bot/internal/analytics`, {
                params: { tenantId },
                headers: { 'x-internal-secret': config.internalSecret }
            });

            if (response.data.success) {
                return response.data.data;
            }
            return { stages: [], conversionRate: 0 };
        } catch (error: any) {
            logger.error('Error fetching funnel stats:', error.message);
            return { stages: [], conversionRate: 0 };
        }
    }


    // Stock Analytics (Cross-service call to Inventory service)
    async getInventoryIntelligence(tenantId: string) {
        try {
            const response = await this.inventoryClient.get(`/internal/analytics`, {
                params: { tenantId },
                headers: { 'x-internal-secret': config.internalSecret }
            });

            if (response.data.success) {
                return response.data.data;
            }
            return { avgDaysInStock: 0, slowMovingCount: 0, brandDistribution: [] };
        } catch (error: any) {
            logger.error('Error fetching inventory intelligence:', error.message);
            return { avgDaysInStock: 0, slowMovingCount: 0, brandDistribution: [] };
        }
    }

    // Recent Activity Feed (Aggregated from Sales and Leads)
    async getRecentActivity(tenantId: string) {
        try {
            const activities: any[] = [];
            
            // 1. Fetch recent invoices (Sales)
            const recentInvoices = await this.invoiceRepository.find({ tenantId }, { sort: { createdAt: -1 }, limit: 3 });
            recentInvoices.forEach(inv => {
                activities.push({
                    id: inv._id,
                    title: `Invoice #${inv.invoiceNumber} generated for ${inv.customerName}`,
                    time: inv.createdAt,
                    type: 'sold'
                });
            });

            // 2. Fetch recent leads from Bot Service
            try {
                const response = await this.botClient.get(`/api/v1/bot/internal/leads/batch`, {
                    params: { tenantId },
                    headers: { 'x-internal-secret': config.internalSecret }
                });
                if (response.data.success) {
                    response.data.data.slice(0, 3).forEach((lead: any) => {
                        activities.push({
                            id: lead._id,
                            title: `New enquiry from ${lead.name || lead.phone}`,
                            time: lead.createdAt || new Date(),
                            type: 'lead'
                        });
                    });
                }
            } catch (e: any) {
                logger.warn('Could not fetch recent leads for activity feed');
            }

            // Sort by time descending
            return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
        } catch (error: any) {
            logger.error('Error fetching recent activity:', error.message);
            return [];
        }
    }
}
