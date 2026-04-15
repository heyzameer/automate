import { injectable, inject } from 'tsyringe';
import { ILeadDocument } from '../models/Lead';
import { logger } from '../utils/logger';
import { notify } from '../utils/notify';
import { ILeadRepository } from '../interfaces/IRepository/ILeadRepository';
import { LeadStatus } from '@carbot/common';

@injectable()
export class LeadService {
    constructor(
        @inject('LeadRepository') private leadRepository: ILeadRepository
    ) {}
    
    /**
     * Score a lead based on activity.
     * Hot: score >= 60
     * High: 40-59
     * Medium: 20-39
     * Low: < 20
     */
    async scoreLead(lead: ILeadDocument, points: number) {
        try {
            lead.score = (lead.score || 0) + points;
            lead.lastActivity = new Date();

            if (lead.score >= 60) {
                lead.priority = 'Hot';
                await notify('lead.scored', lead.tenantId, {
                    customerName: lead.name,
                    phone: lead.phone,
                    score: lead.score,
                    leadId: lead._id || lead.id,
                    carName: lead.vehicleId || 'N/A'
                });
            } else if (lead.score >= 30) {
                lead.priority = 'Warm';
            } else {
                lead.priority = 'Cold';
            }

            return await lead.save();
        } catch (error) {
            logger.error('Error scoring lead:', error);
            return lead;
        }
    }

    async createLead(data: any) {
        // Prevent duplicates - use existing if available
        let lead = await this.leadRepository.findOne({ tenantId: data.tenantId, phone: data.phone });
        if (lead) {
            Object.assign(lead, data);
        } else {
            lead = await this.leadRepository.create(data);
        }
        
        // Initial scoring logic
        if (data.status === LeadStatus.NEW || data.vehicleId) {
            lead.score = (lead.score || 0) + 30; // 30 points for expressing interest in a car
        }
        
        if (lead.score >= 60) lead.priority = 'Hot';
        else if (lead.score >= 30) lead.priority = 'Warm';
        else lead.priority = 'Cold';

        return await lead.save();
    }

    async handleBooking(leadId: string) {
        const lead = await this.leadRepository.findById(leadId);
        if (lead) {
            return await this.scoreLead(lead, 40); // +40 for booking a test drive
        }
        return null;
    }
    
    async handleQRScan(tenantId: string, phone: string, carCode: string) {
        let lead = await this.leadRepository.findOne({ tenantId, phone, vehicleId: carCode });
        
        if (!lead) {
            lead = await this.leadRepository.create({
                tenantId,
                phone,
                vehicleId: carCode,
                source: 'qr_scan',
                stage: 'New',
                status: LeadStatus.NEW
            });
        }
        
        // Scan QR code is a high intent action
        await notify('lead.qr_scan', tenantId, {
            phone,
            carCode,
            type: 'alert'
        });
        return await this.scoreLead(lead, 50); // +50 for scanning QR
    }
}
