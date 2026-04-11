import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { CampaignService } from '../services/CampaignService';
import { Campaign } from '../models/Campaign';

@injectable()
export class CampaignController {
    constructor(private campaignService: CampaignService) {}

    async createCampaign(req: Request, res: Response) {
        try {
            const tenantId = req.headers['x-tenant-id'] as string;
            if (!tenantId) return res.status(400).json({ success: false, message: 'Tenant ID required' });

            const campaign = await this.campaignService.createCampaign({
                ...req.body,
                tenantId
            });
            res.status(201).json({ success: true, data: campaign });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getCampaigns(req: Request, res: Response) {
        try {
            const tenantId = req.headers['x-tenant-id'] as string;
            if (!tenantId) return res.status(400).json({ success: false, message: 'Tenant ID required' });

            const campaigns = await Campaign.find({ tenantId }).sort({ createdAt: -1 });
            res.json({ success: true, data: campaigns });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async startCampaign(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const campaign = await this.campaignService.executeCampaign(id);
            res.json({ 
                success: true, 
                message: 'Campaign execution completed',
                data: campaign 
            });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async updateCampaign(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const campaign = await this.campaignService.updateCampaign(id, req.body);
            res.json({ success: true, data: campaign });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async deleteCampaign(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await this.campaignService.deleteCampaign(id);
            res.json({ success: true, message: 'Campaign deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async reopenCampaign(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const campaign = await this.campaignService.reopenCampaign(id);
            res.json({ success: true, data: campaign });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
