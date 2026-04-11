import { injectable } from 'tsyringe';
import { Campaign, ICampaignDocument } from '../models/Campaign';
import { CampaignRecipient } from '../models/CampaignRecipient';
import { botServiceClient } from '../utils/apiClient';
import { logger } from '../utils/logger';

@injectable()
export class CampaignService {

    async createCampaign(data: any) {
        const campaign = new Campaign(data);
        return await campaign.save();
    }

    async executeCampaign(campaignId: string) {
        const campaign = await Campaign.findById(campaignId);
        if (!campaign || (campaign.status !== 'draft' && campaign.status !== 'scheduled')) {
            throw new Error('Invalid campaign status');
        }

        try {
            campaign.status = 'sending';
            await campaign.save();

            // 1. Fetch leads from bot service based on audience
            const leadRes = await botServiceClient.get('/api/v1/bot/internal/leads/batch', {
                params: { 
                    tenantId: campaign.tenantId,
                    priority: ['hot', 'warm', 'cold'].includes(campaign.audience) ? campaign.audience : undefined
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

            // 2. Process each recipient for personalization
            for (const lead of leads) {
                const personalizedMessage = campaign.message.replace(/{name}/g, lead.name || 'valued customer');
                
                try {
                    // Create recipient record
                    const recipient = await CampaignRecipient.create({
                        campaignId: campaign._id,
                        tenantId: campaign.tenantId,
                        phone: lead.phone,
                        name: lead.name,
                        status: 'pending'
                    });

                    if (campaign.type === 'whatsapp') {
                        // Send via bot service
                        await botServiceClient.post('/api/v1/bot/internal/broadcast', {
                            recipients: [lead.phone],
                            message: personalizedMessage,
                            tenantId: campaign.tenantId
                        });
                    } else {
                        // Email Logic (Mock/Placeholder for Nodemailer/Resend)
                        logger.info(`Sending Email to ${lead.name} (${lead.email || 'no-email'}): ${personalizedMessage}`);
                        // Logic to send email here...
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
            
            // Logic: Create a "New Arrival" broadcast draft
            const campaign = await Campaign.create({
                tenantId,
                name: `New Arrival: ${brand} ${model}`,
                type: 'whatsapp',
                audience: 'hot', // Default to hot leads
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
        return await Campaign.findByIdAndUpdate(campaignId, updates, { new: true });
    }

    async deleteCampaign(campaignId: string) {
        // Delete recipients associated with this campaign
        await CampaignRecipient.deleteMany({ campaignId });
        // Delete campaign itself
        return await Campaign.findByIdAndDelete(campaignId);
    }

    async reopenCampaign(campaignId: string) {
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) throw new Error('Campaign not found');
        
        // Reset stats and status to allow editing and resending
        campaign.status = 'draft';
        campaign.stats = { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
        
        // Optionally clear recipient history if we want a fresh start
        await CampaignRecipient.deleteMany({ campaignId });
        
        return await campaign.save();
    }
}
