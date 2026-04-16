import { injectable, inject } from 'tsyringe';
import { ICampaignDocument } from '../models/Campaign';
import { CampaignRecipient } from '../models/CampaignRecipient';
import { botServiceClient } from '../utils/apiClient';
import { logger } from '../utils/logger';
import { ICampaignRepository } from '../interfaces/IRepository/ICampaignRepository';

@injectable()
export class CampaignService {
    constructor(
        @inject('CampaignRepository') private campaignRepository: ICampaignRepository
    ) {}

    async createCampaign(data: any) {
        return await this.campaignRepository.create(data);
    }

    async executeCampaign(campaignId: string) {
        const campaign = await this.campaignRepository.findById(campaignId);
        if (!campaign || (campaign.status !== 'draft' && campaign.status !== 'scheduled')) {
            throw new Error('Invalid campaign status');
        }

        try {
            campaign.status = 'sending';
            await campaign.save();

            // ... rest of the logic remains the same
            // (Keeping logic brief for this refactor demo, but it would use the repository where needed)
            
            // 1. Fetch leads from bot service based on audience
            const audiencePriority = ['hot', 'warm', 'cold'].includes(campaign.audience.toLowerCase()) 
                ? campaign.audience.charAt(0).toUpperCase() + campaign.audience.slice(1).toLowerCase() 
                : undefined;

            const leadRes = await botServiceClient.get('/api/v1/bot/internal/leads/batch', {
                params: { 
                    tenantId: campaign.tenantId,
                    priority: audiencePriority
                }
            });

            const leads = leadRes.data?.data || [];
            if (leads.length === 0) {
                campaign.status = 'completed';
                await campaign.save();
                return { success: true, message: 'No recipients found for this audience' };
            }

            campaign.stats.total = leads.length;
            await campaign.save();

            let sentCount = 0;
            let failedCount = 0;

            for (const lead of leads) {
                const personalizedMessage = campaign.message.replace(/{name}/g, lead.name || 'valued customer');
                
                try {
                    const recipient = await CampaignRecipient.create({
                        campaignId: campaign._id,
                        tenantId: campaign.tenantId,
                        phone: lead.phone,
                        name: lead.name,
                        status: 'pending'
                    });

                    if (campaign.type === 'whatsapp') {
                        await botServiceClient.post('/api/v1/bot/internal/broadcast', {
                            recipients: [lead.phone],
                            message: personalizedMessage,
                            tenantId: campaign.tenantId
                        });
                    } else {
                        logger.info(`Sending Email to ${lead.name} (${lead.email || 'no-email'}): ${personalizedMessage}`);
                    }

                    recipient.status = 'sent';
                    await recipient.save();
                    sentCount++;
                } catch (err: any) {
                    logger.error(`Failed to send to ${lead.phone}:`, err.message);
                    failedCount++;
                }
            }

            campaign.stats.sent = sentCount;
            campaign.stats.failed = failedCount;
            campaign.status = 'completed';
            return await campaign.save();

        } catch (error: any) {
            campaign.status = 'failed';
            await campaign.save();
            throw error;
        }
    }

    async handleNewArrival(tenantId: string, vehicle: any) {
        try {
            const brand = vehicle.attributes?.brand;
            const model = vehicle.attributes?.model;
            
            const campaign = await this.campaignRepository.create({
                tenantId,
                name: `New Arrival: ${brand} ${model}`,
                type: 'whatsapp',
                audience: 'hot',
                message: `Hi {name}, a stunning ${brand} ${model} just arrived at our showroom! 🚗💨 Check it out before it's gone. Click here to see specs.`,
                status: 'draft'
            });

            logger.info(`Auto-drafted New Arrival campaign for ${brand} ${model} (Tenant: ${tenantId})`);
            return campaign;
        } catch (error: any) {
            logger.error('Error handling new arrival:', error.message);
        }
    }

    async updateCampaign(campaignId: string, updates: Partial<ICampaignDocument>) {
        return await this.campaignRepository.update(campaignId, updates);
    }

    async deleteCampaign(campaignId: string) {
        await CampaignRecipient.deleteMany({ campaignId });
        return await this.campaignRepository.delete(campaignId);
    }

    async reopenCampaign(campaignId: string) {
        const campaign = await this.campaignRepository.findById(campaignId);
        if (!campaign) throw new Error('Campaign not found');
        
        campaign.status = 'draft';
        campaign.stats = { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
        
        await CampaignRecipient.deleteMany({ campaignId });
        return await campaign.save();
    }
}

