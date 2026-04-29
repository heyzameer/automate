import { ApiUsage } from '../models/ApiUsage';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export class UsageService {
    async incrementUsage(tenantId: string, service: 'bot' | 'gemini' | 'kiosk' | 'inventory') {
        const today = new Date().toISOString().split('T')[0];
        try {
            await ApiUsage.findOneAndUpdate(
                { tenantId: new mongoose.Types.ObjectId(tenantId), service, date: today },
                { $inc: { count: 1 } },
                { upsert: true, new: true }
            );
        } catch (error) {
            logger.error(`[USAGE_SERVICE] Failed to increment usage for ${tenantId}/${service}:`, error);
        }
    }

    async getUsageStats(tenantId?: string, startDate?: string, endDate?: string, service?: string, page = 1, limit = 10) {
        const query: any = {};
        if (tenantId) query.tenantId = new mongoose.Types.ObjectId(tenantId);
        if (service) query.service = service;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            ApiUsage.find(query)
                .populate('tenantId', 'name slug')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit),
            ApiUsage.countDocuments(query)
        ]);

        return { data, total, page, limit };
    }

    async getPlatformWideUsage() {
        // Aggregate totals per service
        return ApiUsage.aggregate([
            {
                $group: {
                    _id: '$service',
                    totalRequests: { $sum: '$count' }
                }
            }
        ]);
    }
}
