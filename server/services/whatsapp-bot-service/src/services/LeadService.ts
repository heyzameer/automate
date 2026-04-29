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

            // Manage persistence: Keep track of cars and names
            if (lead.name && !lead.historicalNames.includes(lead.name)) {
                lead.historicalNames.push(lead.name);
            }
            if (lead.vehicleId && !lead.interestedVehicles.includes(lead.vehicleId)) {
                lead.interestedVehicles.push(lead.vehicleId);
            }

            if (lead.score >= 60) {
                lead.priority = 'Hot';
                await notify('lead.scored', lead.tenantId, {
                    customerName: lead.name,
                    phone: lead.phone,
                    score: lead.score,
                    leadId: lead._id || lead.id,
                    carName: lead.vehicleId || 'N/A',
                    priority: 'Hot'
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
            // Update fields if provided but don't overwrite if data is missing
            if (data.name) lead.name = data.name;
            if (data.vehicleId) lead.vehicleId = data.vehicleId;
            if (data.status) lead.status = data.status;
            if (data.stage) lead.stage = data.stage;
            if (data.preferredDateTime) lead.preferredDateTime = data.preferredDateTime;
        } else {
            lead = await this.leadRepository.create(data);
        }
        
        // Initial scoring logic
        if (data.preferredDateTime) {
            await this.scoreLead(lead, 60); // Test drive scheduled = Hot
            
            // Record historical booking
            const alreadyExists = lead.historicalBookings.some(b => b.carId === data.vehicleId && b.date === data.preferredDateTime);
            if (!alreadyExists) {
                lead.historicalBookings.push({
                    carId: data.vehicleId,
                    date: data.preferredDateTime,
                    status: 'scheduled'
                });
            }
        } else if (data.vehicleId) {
            await this.scoreLead(lead, 30); // Interest in car = Warm
        } else if (data.status === LeadStatus.NEW) {
            await this.scoreLead(lead, 10); // Basic interaction
        }
        
        return await lead.save();
    }

    async handleBooking(leadId: string) {
        const lead = await this.leadRepository.findById(leadId);
        if (lead) {
            return await this.scoreLead(lead, 60); // Test drive booking = Hot
        }
        return null;
    }
    
    async handleQRScan(tenantId: string, phone: string, carCode: string) {
        let lead = await this.leadRepository.findOne({ tenantId, phone });
        
        if (!lead) {
            lead = await this.leadRepository.create({
                tenantId,
                phone,
                vehicleId: carCode,
                source: 'qr_scan',
                stage: 'New',
                status: LeadStatus.NEW
            });
        } else {
            lead.vehicleId = carCode;
        }
        
        // Scan QR code is a high intent action
        await notify('lead.qr_scan', tenantId, {
            phone,
            carCode,
            type: 'alert'
        });
        return await this.scoreLead(lead, 30); // Scanning QR = Warm
    }
}
