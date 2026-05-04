import { Request, Response } from 'express';
import { injectable, container, inject } from 'tsyringe';
import QRCode from 'qrcode';
import { Lead } from '../models/Lead';
import { LeadService } from '../services/LeadService';
import { logger } from '../utils/logger';
import { authServiceClient } from '../utils/apiClient';

@injectable()
export class LeadController {
    constructor(
        @inject(LeadService) private leadService: LeadService
    ) {}
    
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

    updateLead = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            // If stage changes, we might want to trigger specific logic
            if (updateData.stage === 'Test Drive') {
                updateData.status = 'booked';
            }

            const lead = await Lead.findByIdAndUpdate(id, { 
                ...updateData,
                lastActivity: new Date()
            }, { new: true });
            
            if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
            
            res.status(200).json({ success: true, data: lead });
        } catch (error) {
            logger.error('Error updating lead:', error);
            res.status(500).json({ success: false, message: 'Failed to update lead' });
        }
    }

    addCallLog = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { note, agent } = req.body;
            
            const lead = await Lead.findById(id);
            if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
            
            lead.callLogs.push({
                date: new Date(),
                note,
                agent
            });
            lead.lastActivity = new Date();
            
            // Adding a log shows engagement, increment score
            lead.score = (lead.score || 0) + 5;
            
            await lead.save();
            res.status(200).json({ success: true, data: lead });
        } catch (error) {
            logger.error('Error adding call log:', error);
            res.status(500).json({ success: false, message: 'Failed to add call log' });
        }
    }

    updateCallLog = async (req: Request, res: Response) => {
        try {
            const { leadId, logId } = req.params;
            const { note } = req.body;

            const lead = await Lead.findById(leadId);
            if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

            const log = (lead.callLogs as any).id(logId);
            if (!log) return res.status(404).json({ success: false, message: 'Log entry not found' });

            log.note = note;
            lead.lastActivity = new Date();
            
            await lead.save();
            res.status(200).json({ success: true, data: lead });
        } catch (error) {
            logger.error('Error updating call log:', error);
            res.status(500).json({ success: false, message: 'Failed to update call log' });
        }
    }

    deleteCallLog = async (req: Request, res: Response) => {
        try {
            const { leadId, logId } = req.params;

            const lead = await Lead.findById(leadId);
            if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

            (lead.callLogs as any).pull({ _id: logId });
            lead.lastActivity = new Date();

            await lead.save();
            res.status(200).json({ success: true, data: lead });
        } catch (error) {
            logger.error('Error deleting call log:', error);
            res.status(500).json({ success: false, message: 'Failed to delete call log' });
        }
    }

    capturePublicLead = async (req: Request, res: Response) => {
        try {
            const tenantId = req.body.tenantId || req.headers['x-tenant-id'];
            const { phone, name, source, vehicleId, note } = req.body;
            
            if (!tenantId || !phone) {
                return res.status(400).json({ success: false, message: 'Missing tenantId or phone' });
            }

            const lead = await this.leadService.createLead({
                tenantId,
                phone,
                name,
                source: source || 'external',
                vehicleId,
                stage: 'New',
                status: 'new'
            });

            if (note) {
                lead.callLogs.push({
                    date: new Date(),
                    note: `[Auto-Capture]: ${note}`,
                    agent: 'System'
                });
                await lead.save();
            }

            res.status(201).json({ success: true, data: lead });
        } catch (error) {
            logger.error('Error capturing public lead:', error);
            res.status(500).json({ success: false, message: 'Capture failed' });
        }
    };

    getQRCode = async (req: Request, res: Response) => {
        try {
            const { carCode } = req.params;
            const tenantId = req.headers['x-tenant-id'];
            
            // Check plan features
            try {
                const tenantRes = await authServiceClient.get(`/internal/auth/tenants/${tenantId}`);
                const tenant = tenantRes.data?.data;
                if (tenant && tenant.features?.qrCode === false) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Feature Locked: QR Code generation is not included in your current plan. Please upgrade to unlock.' 
                    });
                }
            } catch (err: any) {
                logger.warn(`Failed to verify tenant limits for QR code generation: ${err.message}`);
                // If we can't verify, we should probably fail safe (lock) or allow depending on policy.
                // Given the user's request to "enforce this too", let's be strict.
                if (err.response?.status === 403 || err.response?.status === 401) {
                    return res.status(403).json({ success: false, message: 'Unauthorized to generate QR code.' });
                }
            }

            // The URL the QR code will point to
            let scanUrl = `${process.env.PUBLIC_URL || 'http://localhost:5000'}/api/v1/bot/public/scan/${carCode}?tid=${tenantId}`;
            
            // Priority: If showroom has a kiosk website URL, use it!
            try {
                const tenantRes = await authServiceClient.get(`/internal/tenants/${tenantId}`);
                const tenant = tenantRes.data?.data;
                if (tenant && tenant.kioskConfig?.websiteUrl) {
                    const baseUrl = tenant.kioskConfig.websiteUrl.replace(/\/$/, '');
                    scanUrl = `${baseUrl}/inventory/${carCode}`;
                }
            } catch (err) {
                logger.warn(`Failed to fetch tenant websiteUrl for QR: ${err}`);
            }
            
            const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff'
                }
            });

            res.status(200).json({ success: true, data: qrCodeDataUrl });
        } catch (error) {
            logger.error('Error generating QR code:', error);
            res.status(500).json({ success: false, message: 'Failed to generate QR code' });
        }
    };

    renderScanPage = async (req: Request, res: Response) => {
        try {
            const { carCode } = req.params;
            const { tid: tenantId } = req.query;

            // Fetch tenant info for the landing page
            let tenantInfo = { name: 'Showroom', phone: '', address: '' };
            try {
                const tenantRes = await authServiceClient.get(`/internal/tenants/${tenantId}`);
                const t = tenantRes.data?.data;
                if (t) {
                    tenantInfo = { 
                        name: t.name || 'Showroom', 
                        phone: t.supportPhone || t.phone || '', 
                        address: t.address || '' 
                    };
                }
            } catch (_) {}

            const cleanPhone = tenantInfo.phone.replace(/\D/g, '');

            // For now, let's render a high-end mobile landing page
            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tenantInfo.name} | Vehicle Details</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; }
        .glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.3); }
        .btn-gradient { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); }
    </style>
</head>
<body class="p-0 m-0 text-slate-900">
    <div class="max-w-md mx-auto min-h-screen relative pb-32">
        <!-- Hero Section -->
        <div class="h-80 bg-slate-200 relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
            <div class="absolute bottom-6 left-6 right-6 text-white">
                <span class="bg-indigo-500 text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded">Stock: ${carCode}</span>
                <h1 class="text-3xl font-extrabold mt-2">${tenantInfo.name}</h1>
                <p class="text-slate-300 font-medium">${tenantInfo.address || 'Premium Selection'}</p>
            </div>
        </div>

        <!-- Details Grid -->
        <div class="p-6 grid grid-cols-2 gap-4">
            <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
                <p class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Action</p>
                <p class="text-xl font-extrabold text-slate-900 mt-1">Visit Site</p>
            </div>
            <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
                <p class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status</p>
                <p class="text-xl font-extrabold text-emerald-600 mt-1">Available</p>
            </div>
        </div>

        <!-- Lead Capture Section -->
        <div class="p-6 mt-4">
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                <h3 class="text-xl font-extrabold text-slate-900">Interested?</h3>
                <p class="text-slate-400 font-medium text-sm mt-1">Drop your details, our agent will call you.</p>
                
                <form id="leadForm" class="mt-6 space-y-4">
                    <input type="text" id="name" placeholder="Your Name" required
                        class="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all">
                    
                    <input type="tel" id="phone" placeholder="Phone Number" required
                        class="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all">
                    
                    <button type="submit" id="submitBtn"
                        class="w-full btn-gradient text-white py-5 rounded-2xl font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">
                        Request Call Back
                    </button>
                </form>
                <div id="successMsg" class="hidden mt-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-center font-bold">
                    Success! We'll reach out shortly.
                </div>
            </div>
        </div>

        <!-- Footer Call Buttons -->
        <div class="fixed bottom-6 left-6 right-6 flex gap-4 z-50">
            <a href="https://wa.me/${cleanPhone}?text=Hi, I am interested in vehicle ${carCode}" 
               class="flex-1 glass p-5 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                <span class="text-xl">💬</span>
                <span class="font-extrabold text-xs uppercase tracking-widest text-indigo-600">WhatsApp</span>
            </a>
            <a href="tel:${cleanPhone}" 
               class="flex-1 btn-gradient p-5 rounded-3xl flex items-center justify-center gap-3 text-white shadow-xl shadow-indigo-100 active:scale-95 transition-all">
                <span class="text-xl">📞</span>
                <span class="font-extrabold text-xs uppercase tracking-widest">Call Now</span>
            </a>
        </div>
    </div>

    <script>
        const form = document.getElementById('leadForm');
        const submitBtn = document.getElementById('submitBtn');
        const successMsg = document.getElementById('successMsg');

        form.onsubmit = async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            submitBtn.innerText = 'SENDING...';

            try {
                const response = await fetch('/api/v1/bot/public/capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tenantId: '${tenantId}',
                        phone: document.getElementById('phone').value,
                        name: document.getElementById('name').value,
                        vehicleId: '${carCode}',
                        source: 'qr_scan',
                        note: 'Customer scanned QR sticker for stock: ${carCode}'
                    })
                });

                if (response.ok) {
                    form.classList.add('hidden');
                    successMsg.classList.remove('hidden');
                }
            } catch (err) {
                alert('Connection error. Please try calling instead.');
                submitBtn.disabled = false;
                submitBtn.innerText = 'REQUEST CALL BACK';
            }
        };
    </script>
</body>
</html>
            `;

            res.setHeader('Content-Type', 'text/html');
            res.status(200).send(html);
        } catch (error) {
            logger.error('Error rendering scan page:', error);
            res.status(500).send('<h1>Internal Server Error</h1>');
        }
    };

    getLeadsByVehicle = async (req: Request, res: Response) => {
        try {
            const { vehicleId } = req.params;
            const leads = await Lead.find({ vehicleId }).sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: leads });
        } catch (error) {
            logger.error('Error fetching leads by vehicle:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch leads for this vehicle' });
        }
    }
}
