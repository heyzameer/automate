import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { Subscription, SubscriptionStatus } from '../models/Subscription';
import { injectable } from 'tsyringe';

@injectable()
export class BillingController {
    
    getSubscriptions = asyncHandler(async (req: Request, res: Response) => {
        const { tenantId } = req.query;
        const filter = tenantId ? { tenantId } : {};
        const subscriptions = await Subscription.find(filter)
            .sort({ createdAt: -1 })
            .populate('tenantId', 'name');
        sendSuccess(res, 'Subscriptions retrieved', subscriptions);
    });

    updateSubscription = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const updateData = req.body;
        const subscription = await Subscription.findByIdAndUpdate(id, updateData, { new: true });
        sendSuccess(res, 'Subscription details updated', subscription);
    });

    getBillingDashboard = asyncHandler(async (req: Request, res: Response) => {
        const totalRevenue = await Subscription.aggregate([
            { $match: { status: SubscriptionStatus.ACTIVE } },
            // Simplified for demo: assuming basic=100, pro=200, enterprise=500
            { $group: { 
                _id: null, 
                estimatedMonthly: { $sum: { $cond: [
                    { $eq: ["$planId", "enterprise"] }, 500, { $cond: [
                        { $eq: ["$planId", "pro"] }, 200, 100
                    ]}
                ]} }
            } }
        ]);
        
        sendSuccess(res, 'Billing stats retrieved', {
            activeSubscriptions: await Subscription.countDocuments({ status: SubscriptionStatus.ACTIVE }),
            totalPotentialMonthly: totalRevenue[0]?.estimatedMonthly || 0
        });
    });
}
