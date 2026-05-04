import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { LeadService } from '../services/LeadService';
import { WhatsAppService } from '../services/WhatsAppService';
import { ILeadRepository } from '../interfaces/IRepository/ILeadRepository';
import { authServiceClient } from '../utils/apiClient';
import config from '../config';

const router = Router();

const getLeadService = () => container.resolve(LeadService);
const getWhatsappService = () => container.resolve(WhatsAppService);
const getLeadRepository = () => container.resolve<ILeadRepository>('LeadRepository');

// Secure internal-only auth check via shared secret header
router.use((req: Request, res: Response, next: NextFunction) => {
    const internalSecret = req.headers['x-internal-secret'];
    if (internalSecret !== config.internalSecret) {
        return res.status(403).json({ success: false, message: 'Forbidden: Internal Service Mesh Only' });
    }
    next();
});

/**
 * POST /internal/leads
 * Create a test drive lead from the bot service.
 */
router.post('/leads', async (req, res) => {
    try {
        const lead = await getLeadService().createLead(req.body);
        res.status(201).json({ success: true, data: lead });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /internal/qr-scan
 * Handle a QR scan from the showroom yard.
 */
router.post('/qr-scan', async (req, res) => {
    try {
        const { tenantId, phone, carCode } = req.body;
        const lead = await getLeadService().handleQRScan(tenantId, phone, carCode);
        res.json({ success: true, data: lead });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /internal/leads/batch
 * Fetch multiple leads for a tenant with optional priority filtering.
 */
router.get('/leads/batch', async (req, res) => {
    try {
        const { tenantId, priority, leadIds } = req.query;
        const filters: any = { tenantId };
        
        if (priority) filters.priority = priority;
        
        if (leadIds) {
            const ids = Array.isArray(leadIds) ? leadIds : (leadIds as string).split(',');
            filters._id = { $in: ids };
        }

        const leads = await getLeadRepository().find(filters);
        const mappedLeads = leads.map(l => ({ phone: l.phone, name: l.name, priority: l.priority, email: (l as any).email }));
        res.json({ success: true, data: mappedLeads });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /internal/leads
 * Fetch leads for a customer by phone number.
 */
router.get('/leads', async (req, res) => {
    try {
        const { tenantId, phone } = req.query;
        const leads = await getLeadRepository().find({
            tenantId,
            phone,
            status: { $nin: ['cancelled', 'lost'] }
        }, { createdAt: -1 }, 3);
        res.json({ success: true, data: leads });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /internal/leads/:id
 * Update a lead status or reschedule date.
 */
router.patch('/leads/:id', async (req, res) => {
    try {
        const lead = await getLeadRepository().findById(req.params.id);
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
        
        const updatedLead = await getLeadRepository().update(req.params.id, req.body);
        
        // If status changed to booked, increase score
        if (req.body.status === 'booked' && updatedLead) {
            await getLeadService().scoreLead(updatedLead, 30);
        }

        res.json({ success: true, data: updatedLead });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /internal/leads/score
 * Update a lead score based on engagement.
 */
router.post('/leads/score', async (req, res) => {
    try {
        const { tenantId, phone, points } = req.body;
        let lead = await getLeadRepository().findOne({ tenantId, phone });
        if (!lead) {
            lead = await getLeadRepository().create({ tenantId, phone, source: 'whatsapp_interaction', score: points });
        } else {
            await getLeadService().scoreLead(lead, points);
        }
        res.json({ success: true, score: lead.score, priority: lead.priority });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /internal/broadcast
 * Send a bulk message via WhatsApp service.
 */
router.post('/broadcast', async (req, res) => {
    try {
        const { recipients, message, tenantId } = req.body;
        let { phoneNumberId, accessToken } = req.body;

        if (!recipients || !message || !tenantId) {
            return res.status(400).json({ success: false, message: 'Missing required broadcast fields (recipients, message, tenantId)' });
        }

        // If credentials not provided, fetch them from Auth Service via HTTP API
        if (!phoneNumberId || !accessToken) {
            const tenantRes = await authServiceClient.get(`/internal/tenants/${tenantId}`);
            const tenant = tenantRes.data?.data;
            if (!tenant || !tenant.isActive) {
                return res.status(404).json({ success: false, message: 'Tenant not found or inactive' });
            }

            if (tenant.whatsappConfig?.isActive === false || tenant.whatsappConfig?.botEnabled === false) {
                return res.status(403).json({ success: false, message: 'WhatsApp bot is currently disabled for this showroom' });
            }

            if (!tenant.whatsappConfig?.accessToken || !tenant.whatsappConfig?.phoneNumberId) {
                return res.status(400).json({ success: false, message: 'Tenant WhatsApp configuration is incomplete' });
            }

            phoneNumberId = tenant.whatsappConfig.phoneNumberId;
            accessToken = tenant.whatsappConfig.accessToken; 
        }

        const results = await getWhatsappService().sendBulkText(recipients, message, phoneNumberId, accessToken);
        res.json({ success: true, data: results });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/analytics', async (req, res) => {
    try {
        const tenantId = req.query.tenantId as string;
        if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId required' });

        const leads = await getLeadRepository().find({ tenantId });
        
        const stages = [
            { stage: 'New', count: leads.filter(l => l.status === 'new').length },
            { stage: 'Contacted', count: leads.filter(l => l.status === 'contacted').length },
            { stage: 'Test Drive', count: leads.filter(l => l.status === 'test_drive').length },
            { stage: 'Negotiation', count: leads.filter(l => l.status === 'negotiation').length },
            { stage: 'Closed', count: leads.filter(l => l.status === 'closed').length }
        ];

        const totalLeads = leads.length;
        const closedLeads = leads.filter(l => l.status === 'closed').length;
        const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;

        res.json({
            success: true,
            data: {
                stages,
                conversionRate: Number(conversionRate.toFixed(1))
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/leads/vehicle/:vehicleId', async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const leads = await getLeadRepository().find({ vehicleId }, { createdAt: -1 });
        res.json({ success: true, data: leads });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/leads/stats', async (req, res) => {
    try {
        const tenantId = req.query.tenantId as string;
        if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId required' });

        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const allLeads = await getLeadRepository().find({ tenantId });
        const leadsThisMonth = allLeads.filter(l => new Date(l.createdAt) >= monthStart).length;
        const recentLeads = [...allLeads]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map(l => ({
                _id: (l as any)._id,
                name: l.name,
                phone: l.phone,
                stage: l.status,
                priority: l.priority,
                createdAt: l.createdAt,
            }));

        res.json({
            success: true,
            data: { totalLeads: allLeads.length, leadsThisMonth, recentLeads }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
