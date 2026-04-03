import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { Lead } from '../models/Lead';
import { logger } from '../utils/logger';

@injectable()
export class LeadController {
    
    getLeads = async (req: Request, res: Response) => {
        try {
            const tenantId = req.headers['x-tenant-id'];
            const { tenantId: queryTenantId } = req.query; // For super admin view
            
            const filter: any = {};
            if (queryTenantId) {
                filter.tenantId = queryTenantId;
            } else if (tenantId) {
                filter.tenantId = tenantId;
            }

            const leads = await Lead.find(filter).sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: leads });
        } catch (error) {
            logger.error('Error fetching leads:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch leads' });
        }
    }

    updateStatus = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const lead = await Lead.findByIdAndUpdate(id, { status }, { new: true });
            res.status(200).json({ success: true, data: lead });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update lead' });
        }
    }

    reschedule = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { preferredDateTime } = req.body;
            const lead = await Lead.findByIdAndUpdate(id, { 
                preferredDateTime,
                status: 'rescheduled'
            }, { new: true });
            res.status(200).json({ success: true, data: lead });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to reschedule lead' });
        }
    }
}
