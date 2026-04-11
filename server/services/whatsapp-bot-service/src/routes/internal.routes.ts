import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { Vehicle } from '../models/Vehicle';
import { Lead } from '../models/Lead';
import { Tenant } from '../models/Tenant';
import { LeadService } from '../services/LeadService';
import { WhatsAppService } from '../services/WhatsAppService';

const router = Router();
const leadService = container.resolve(LeadService);
const whatsappService = container.resolve(WhatsAppService);

// Secure internal-only auth check via shared secret header
router.use((req: Request, res: Response, next: NextFunction) => {
    const internalSecret = req.headers['x-internal-secret'];
    if (internalSecret !== 'carbot-internal-super-secret') {
        return res.status(403).json({ success: false, message: 'Forbidden: Internal Service Mesh Only' });
    }
    next();
});

/**
 * GET /internal/vehicles
 * Search vehicles by query params for the bot service.
 */
router.get('/vehicles', async (req, res) => {
    try {
        const { tenantId, brand, model, fuel_type, year, max_price, car_code, status } = req.query;
        const filters: any = {};

        if (tenantId) filters.tenantId = tenantId;
        if (status) filters.status = status; else filters.status = 'available';
        if (brand) filters['attributes.brand'] = new RegExp(brand as string, 'i');
        if (model) filters['attributes.model'] = new RegExp(model as string, 'i');
        if (fuel_type) filters['attributes.fuel_type'] = new RegExp(fuel_type as string, 'i');
        if (year) filters['attributes.year_of_manufacture'] = Number(year);
        if (max_price) filters['attributes.price'] = { $lte: Number(max_price) };
        if (car_code) filters['attributes.car_code'] = car_code;

        const vehicles = await Vehicle.find(filters).sort({ createdAt: -1 }).limit(5);
        res.json({ success: true, data: vehicles });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /internal/leads
 * Create a test drive lead from the bot service.
 */
router.post('/leads', async (req, res) => {
    try {
        const lead = await leadService.createLead(req.body);
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
        const lead = await leadService.handleQRScan(tenantId, phone, carCode);
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
        const { tenantId, priority } = req.query;
        const filters: any = { tenantId };
        if (priority) filters.priority = priority;

        const leads = await Lead.find(filters).select('phone name priority').lean();
        res.json({ success: true, data: leads });
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
        const leads = await Lead.find({
            tenantId,
            phone,
            status: { $nin: ['cancelled', 'lost'] }
        }).sort({ createdAt: -1 }).limit(3);
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
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
        
        Object.assign(lead, req.body);
        
        // If status changed to booked, increase score
        if (req.body.status === 'booked') {
            await leadService.scoreLead(lead, 30);
        } else {
            await lead.save();
        }

        res.json({ success: true, data: lead });
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
        let lead = await Lead.findOne({ tenantId, phone });
        if (!lead) {
            lead = new Lead({ tenantId, phone, source: 'whatsapp_interaction', score: points });
            await lead.save();
        } else {
            await leadService.scoreLead(lead, points);
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

        // If credentials not provided, fetch them from DB
        if (!phoneNumberId || !accessToken) {
            const tenant = await Tenant.findById(tenantId).select('whatsappConfig');
            if (!tenant || !tenant.whatsappConfig?.accessToken) {
                return res.status(404).json({ success: false, message: 'Tenant WhatsApp config not found' });
            }
            phoneNumberId = tenant.whatsappConfig.phoneNumberId;
            accessToken = tenant.whatsappConfig.accessToken; // Assumes it was stored decrypted or decrypts here if needed
        }

        const results = await whatsappService.sendBulkText(recipients, message, phoneNumberId, accessToken);
        res.json({ success: true, data: results });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/analytics', async (req, res) => {
    try {
        const tenantId = req.query.tenantId as string;
        if (!tenantId) return res.status(400).json({ success: false, message: 'tenantId required' });

        const leads = await Lead.find({ tenantId });
        
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

router.get('/internal/leads/vehicle/:vehicleId', async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const leads = await Lead.find({ vehicleId }).sort({ createdAt: -1 });
        res.json({ success: true, data: leads });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
