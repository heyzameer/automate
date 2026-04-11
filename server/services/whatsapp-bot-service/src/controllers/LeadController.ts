import { Request, Response } from 'express';
import { injectable, container } from 'tsyringe';
import QRCode from 'qrcode';
import { Lead } from '../models/Lead';
import { LeadService } from '../services/LeadService';
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

    capturePublicLead = async (req: Request, res: Response) => {
        try {
            const { tenantId, phone, name, source, vehicleId, note } = req.body;
            
            if (!tenantId || !phone) {
                return res.status(400).json({ success: false, message: 'Missing tenantId or phone' });
            }

            const leadService = container.resolve(LeadService);
            const lead = await leadService.createLead({
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
            
            // The URL the QR code will point to
            const scanUrl = `${process.env.PUBLIC_URL || 'http://localhost:5000'}/api/v1/bot/public/scan/${carCode}?tid=${tenantId}`;
            
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

            // In a real app, you'd fetch car details from inventory-service here
            // const car = await inventoryService.getCarByCode(tenantId, carCode);
            
            // For now, let's render a high-end mobile landing page
            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vehicle Details | CarBot AI</title>
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
                <h1 class="text-3xl font-extrabold mt-2">Premium SUV</h1>
                <p class="text-slate-300 font-medium">Model 2023 • 12,500 KM</p>
            </div>
        </div>

        <!-- Details Grid -->
        <div class="p-6 grid grid-cols-2 gap-4">
            <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <p class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Pricing</p>
                <p class="text-xl font-extrabold text-slate-900 mt-1">₹ 45.50 Lakh</p>
            </div>
            <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <p class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Fuel Type</p>
                <p class="text-xl font-extrabold text-slate-900 mt-1">Diesel</p>
            </div>
        </div>

        <!-- Feature List -->
        <div class="px-6 space-y-3">
            <div class="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">✓</div>
                <p class="font-bold text-slate-600">Company Serviced</p>
            </div>
            <div class="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">✓</div>
                <p class="font-bold text-slate-600">Under Warranty</p>
            </div>
        </div>

        <!-- Lead Capture Section -->
        <div class="p-6 mt-4">
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                <h3 class="text-xl font-extrabold text-slate-900">Interested?</h3>
                <p class="text-slate-400 font-medium text-sm mt-1">Drop your details, our agent will call you.</p>
                
                <form id="leadForm" class="mt-6 space-y-4">
                    <input type="hidden" name="tid" value="${tenantId}">
                    <input type="hidden" name="vId" value="${carCode}">
                    
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
            <a href="https://wa.me/91XXXXXXXXXX?text=Hi, I am interested in ${carCode}" 
               class="flex-1 glass p-5 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                <span class="text-xl">💬</span>
                <span class="font-extrabold text-xs uppercase tracking-widest text-indigo-600">WhatsApp</span>
            </a>
            <a href="tel:+91XXXXXXXXXX" 
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
