import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess } from '../utils/response';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { injectable } from 'tsyringe';

@injectable()
export class CampaignController {
    
    getCampaigns = asyncHandler(async (req: Request, res: Response) => {
        const { tenantId } = req.query;
        const filter = tenantId ? { tenantId } : {};
        const campaigns = await Campaign.find(filter).sort({ createdAt: -1 });
        sendSuccess(res, 'Campaigns retrieved', campaigns);
    });

    createCampaign = asyncHandler(async (req: Request, res: Response) => {
        const campaign = await Campaign.create(req.body);
        sendSuccess(res, 'Campaign created successfully', campaign);
    });

    updateCampaignStatus = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;
        const campaign = await Campaign.findByIdAndUpdate(id, { status }, { new: true });
        sendSuccess(res, 'Campaign status updated', campaign);
    });

    deleteCampaign = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        await Campaign.findByIdAndDelete(id);
        sendSuccess(res, 'Campaign deleted');
    });
}
