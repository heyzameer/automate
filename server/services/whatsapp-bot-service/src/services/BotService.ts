import { injectable } from 'tsyringe';
import { redisClient } from '../utils/redis';
import { authServiceClient, inventoryServiceClient, botServiceClient } from '../utils/apiClient';
import { GeminiService } from './GeminiService';
import { WhatsAppService } from './WhatsAppService';
import { logger } from '../utils/logger';

// All INTERNAL_HEADERS usage is now baked into the per-service clients
const INTERNAL_HEADERS = { 'x-internal-secret': 'carbot-internal-super-secret' };

export interface ISessionData {
    tenantId: string;
    phone: string;
    state: string;
    context: any;
    lastActive: Date;
}

@injectable()
export class BotService {
    constructor(
        private geminiService: GeminiService,
        private whatsappService: WhatsAppService
    ) { }

    async handleIncomingMessage(phoneNumberId: string, from: string, messageBody: string) {
        try {
            // 1. Find Tenant via Auth Service internal API
            const tenantRes = await authServiceClient.get(`/internal/tenants/whatsapp/${phoneNumberId}`);
            const tenant = tenantRes.data?.data;

            if (!tenant) {
                logger.warn(`Tenant not found or inactive for phone_number_id: ${phoneNumberId}`);
                return;
            }

            // Normalize tenant ID — Tenant's toJSON transform remaps _id → id
            const tenantId = (tenant.id || tenant._id)?.toString();
            if (!tenantId) {
                logger.warn(`Tenant found but has no ID for phone_number_id: ${phoneNumberId}`);
                return;
            }

            console.log(`📩 INCOMING: "${messageBody}" from ${from}`);

            // 2. Get User Session from Redis (in-memory, no disk I/O)
            const sessionKey = `session:${tenantId}:${from}`;
            let sessionData = await redisClient.get(sessionKey);
            let session: ISessionData;

            if (sessionData) {
                session = JSON.parse(sessionData);
            } else {
                session = {
                    tenantId,
                    phone: from,
                    state: 'IDLE',
                    context: { search_filters: {} },
                    lastActive: new Date()
                };
            }

            session.lastActive = new Date();

            const saveSession = async () => {
                await redisClient.set(sessionKey, JSON.stringify(session), 'EX', 86400); // 24h TTL
            };

            const lowerMessage = messageBody.toLowerCase().trim();

            // 3. Global Commands - always reset to MENU regardless of state
            if (['menu', 'hi', 'hello', 'start', 'restart'].includes(lowerMessage)) {
                session.state = 'MENU';
                await saveSession();
                return this.sendMenu(tenant, from);
            }

            // 4. Stock Code Detection (car01, car02, etc.) or QR Scan
            const stockCodeMatch = lowerMessage.match(/(car\d+)/i);
            const qrScanMatch = lowerMessage.match(/scan_(car\d+)/i);
            
            if (stockCodeMatch || qrScanMatch) {
                const code = stockCodeMatch ? stockCodeMatch[1] : qrScanMatch![1];
                console.log(`🏷️ MATCHED CODE/QR: ${code}`);
                
                // If this is a QR scan (explicit or new session with code), track it in leads
                if (qrScanMatch || !sessionData) {
                    await botServiceClient.post('/internal/qr-scan', {
                        tenantId,
                        phone: from,
                        carCode: code.toLowerCase()
                    });
                }

                await this.sendVehicleDetailByCode(tenant, session, from, code.toLowerCase());
                await saveSession();
                return;
            }

            // 5. Trigger Booking flow
            if (session.state === 'CAR_DETAIL' && (lowerMessage === 'book' || lowerMessage === 'yes')) {
                session.state = 'AWAITING_NAME';
                await saveSession();
                return this.whatsappService.sendTextMessage(
                    from,
                    "🚙 Great! What is your name?",
                    tenant.whatsappConfig.phoneNumberId,
                    tenant.whatsappConfig.accessToken
                );
            }

            // 5.5 Global Interactive Menu Action Intercept
            // Handles cases where users click buttons while in IDLE state, or copy-paste button text.
            let actionToken = messageBody;
            
            // Hard mapping for WhatsApp UI List copy-pasting
            const textMap: Record<string, string> = {
                'browse inventory': 'MENU_INVENTORY',
                'available cars': 'MENU_INVENTORY',
                'search by nlp': 'MENU_SEARCH',
                'suv, petrol': 'MENU_SEARCH',
                'search by budget': 'MENU_BUDGET',
                'price range': 'MENU_BUDGET',
                'my bookings': 'MENU_BOOKINGS',
                'view, change or cancel': 'MENU_BOOKINGS',
                'showroom location': 'MENU_LOCATION',
                'address & map': 'MENU_LOCATION'
            };

            for (const [key, token] of Object.entries(textMap)) {
                if (lowerMessage.includes(key)) {
                    actionToken = token;
                    break;
                }
            }

            if (actionToken.startsWith('MENU_') || actionToken.startsWith('CANCEL_LEAD_') || actionToken.startsWith('RESCHEDULE_LEAD_')) {
                await this.handleMenuSelection(tenant, session, from, actionToken);
                await saveSession();
                return;
            }

            // 6. State-Based Logic
            switch (session.state) {
                case 'MENU':
                    await this.handleMenuSelection(tenant, session, from, messageBody);
                    break;
                case 'SEARCH_BUDGET':
                    await this.handleBudgetSearch(tenant, session, from, messageBody);
                    break;
                case 'AWAITING_NAME':
                    await this.handleBookingName(tenant, session, from, messageBody);
                    break;
                case 'BOOK_DATE':
                    await this.handleBookingDate(tenant, session, from, messageBody);
                    break;
                case 'RESCHEDULE_DATE':
                    await this.handleRescheduleDate(tenant, session, from, messageBody);
                    break;
                default:
                    await this.processNaturalQuery(tenant, session, from, messageBody);
            }

            await saveSession();

        } catch (error) {
            logger.error('Error in handleIncomingMessage:', error);
        }
    }

    private async sendMenu(tenant: any, to: string) {
        const message = tenant.whatsappConfig.greetingMessage || `🙏 Welcome to *${tenant.name}*! How can I help you today?`;
        const sections = [
            {
                title: 'Inventory',
                rows: [
                    { id: 'MENU_INVENTORY', title: '🚗 Browse Inventory', description: 'Available cars' },
                    { id: 'MENU_SEARCH', title: '🔍 Search by NLP', description: 'SUV, Petrol, etc.' },
                    { id: 'MENU_BUDGET', title: '💰 Search by Budget', description: 'Your price range' }
                ]
            },
            {
                title: 'Bookings',
                rows: [
                    { id: 'MENU_BOOKINGS', title: '📅 My Bookings', description: 'View, Change or Cancel' }
                ]
            },
            {
                title: 'Info',
                rows: [
                    { id: 'MENU_LOCATION', title: '📍 Showroom Location', description: 'Address & map' }
                ]
            }
        ];

        await this.whatsappService.sendInteractiveList(
            to, message, sections,
            tenant.whatsappConfig.phoneNumberId,
            tenant.whatsappConfig.accessToken
        );
    }

    private async handleMenuSelection(tenant: any, session: ISessionData, to: string, selection: string) {
        // Score for browsing menu
        await botServiceClient.post('/internal/leads/score', { tenantId: session.tenantId, phone: to, points: 5 });

        switch (selection) {
            case 'MENU_INVENTORY':
                await this.sendLatestVehicles(tenant, to);
                break;
            case 'MENU_BOOKINGS':
                await this.sendMyBookings(tenant, session, to);
                break;
            case 'MENU_BUDGET':
                session.state = 'SEARCH_BUDGET';
                await this.whatsappService.sendTextMessage(to, "💰 What is your budget? (e.g. 10 lakh or 500000)", tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);
                break;
            case 'MENU_LOCATION':
                // Higher score for location intent
                await botServiceClient.post('/internal/leads/score', { tenantId: session.tenantId, phone: to, points: 10 });
                const locationMsg = `📍 *Showroom Location*\n\n*${tenant.name}*\n${tenant.address || 'Location details shared above.'}${tenant.locationUrl ? `\n\n📌 Map: ${tenant.locationUrl}` : ''}`;
                await this.whatsappService.sendTextMessage(to, locationMsg, tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);
                break;
            default:
                if (selection.startsWith('CANCEL_LEAD_')) {
                    await this.handleCancelBooking(tenant, selection.split('CANCEL_LEAD_')[1], to);
                } else if (selection.startsWith('RESCHEDULE_LEAD_')) {
                    session.state = 'RESCHEDULE_DATE';
                    session.context.rescheduling_id = selection.split('RESCHEDULE_LEAD_')[1];
                    await this.whatsappService.sendTextMessage(to, "🗓️ What is the new date and time you prefer?", tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);
                } else {
                    await this.processNaturalQuery(tenant, session, to, selection);
                }
        }
    }

    private async sendMyBookings(tenant: any, session: ISessionData, to: string) {
        const res = await botServiceClient.get('/internal/leads', {
            params: { tenantId: session.tenantId, phone: to }
        });
        
        // Filter out leads that don't actually have a test drive booking scheduled
        const leads = (res.data?.data || []).filter((l: any) => l.preferredDateTime);

        if (leads.length === 0) {
            return this.whatsappService.sendTextMessage(to, "🔍 You don't have any active test drive bookings. Type MENU to browse cars or start a new booking!", tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);
        }

        for (const lead of leads) {
            // Fetch vehicle info for display
            let vehicleLabel = 'Vehicle';
            try {
                if (lead.vehicleId) {
                    const vRes = await inventoryServiceClient.get('/internal/vehicles', {
                        params: { tenantId: session.tenantId, car_code: lead.vehicleId }
                    });
                    const v = vRes.data?.data?.[0];
                    if (v) vehicleLabel = `${v.attributes?.brand || ''} ${v.attributes?.model || ''}`.trim();
                }
            } catch (_) {}

            const msg = `🚗 *${vehicleLabel}*\n🗓️ ${lead.preferredDateTime}`;
            const buttons = [
                { id: `RESCHEDULE_LEAD_${lead._id}`, title: '🗓️ Reschedule' },
                { id: `CANCEL_LEAD_${lead._id}`, title: '❌ Cancel' }
            ];
            await this.whatsappService.sendInteractiveButtons(to, msg, buttons, tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);
        }
    }

    private async handleCancelBooking(tenant: any, leadId: string, to: string) {
        // ✅ HTTP PATCH to bot-service internal leads endpoint
        await botServiceClient.patch(`/internal/leads/${leadId}`, { status: 'cancelled' });
        await this.whatsappService.sendTextMessage(to, "❌ Your booking has been cancelled successfully. Type MENU if you change your mind!", tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);
    }

    private async handleBudgetSearch(tenant: any, session: ISessionData, to: string, input: string) {
        let price = parseInt(input.replace(/[^\d]/g, ''));
        if (input.toLowerCase().includes('lakh')) price *= 100000;
        if (isNaN(price)) {
            return this.whatsappService.sendTextMessage(to, "Enter a valid amount like '10 lakh' or '500000'.", tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);
        }
        if (!session.context) session.context = {};
        session.context.search_filters = { max_price: price };
        await this.executeSearch(tenant, session, to);
        session.state = 'IDLE';
    }

    private async processNaturalQuery(tenant: any, session: ISessionData, to: string, query: string) {
        // Score for asking questions
        await botServiceClient.post('/internal/leads/score', { tenantId: session.tenantId, phone: to, points: 10 });

        const nlpResult = await this.geminiService.parseCarQuery(query);

        if (!nlpResult || nlpResult.intent === 'greeting') return this.sendMenu(tenant, to);

        if (nlpResult.intent === 'irrelevant') {
            return this.whatsappService.sendTextMessage(
                to,
                "🙏 I am an AI concierge exclusively trained to assist you with car sales, inventory, and test drives! Please let me know what kind of car you are looking for, or type MENU to browse our showroom.",
                tenant.whatsappConfig.phoneNumberId,
                tenant.whatsappConfig.accessToken
            );
        }

        if (!session.context) session.context = {};
        session.context.search_filters = { ...nlpResult };
        await this.executeSearch(tenant, session, to);
    }

    private async executeSearch(tenant: any, session: ISessionData, to: string) {
        const sf = session.context?.search_filters || {};

        // ✅ HTTP call to inventory-service internal API
        const params: any = { tenantId: session.tenantId, status: 'available' };
        if (sf.brand) params.brand = sf.brand;
        if (sf.model) params.model = sf.model;
        if (sf.fuel_type) params.fuel_type = sf.fuel_type;
        if (sf.year) params.year = sf.year;
        if (sf.max_price) params.max_price = sf.max_price;

        const res = await inventoryServiceClient.get('/internal/vehicles', { params });
        const vs = res.data?.data || [];

        if (vs.length === 0) {
            return this.whatsappService.sendTextMessage(to, `🔍 No cars found matching your criteria. Type MENU to browse all inventory.`, tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);
        }

        let r = `🔍 Found *${vs.length}* match(es):\n\n`;
        vs.forEach((v: any) => {
            const attrs = v.attributes || {};
            const brand = attrs.brand || attrs.get?.('brand') || '';
            const model = attrs.model || attrs.get?.('model') || '';
            const price = attrs.price || attrs.get?.('price') || 0;
            const code = attrs.car_code || attrs.get?.('car_code') || 'N/A';
            r += `🚗 *${brand} ${model}*\n💰 ₹ ${Number(price).toLocaleString('en-IN')}\n🏷️ Code: *${code}*\n\n`;
        });
        r += `Send Code (e.g. car01) for more details!`;
        await this.whatsappService.sendTextMessage(to, r, tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);
    }

    private async sendVehicleDetailByCode(tenant: any, session: ISessionData, to: string, code: string) {
        const res = await inventoryServiceClient.get('/internal/vehicles', {
            params: { tenantId: session.tenantId, car_code: code }
        });
        const v = res.data?.data?.[0];

        if (!v) return this.whatsappService.sendTextMessage(to, `❌ Car *${code}* not found. Type MENU to browse.`, tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);

        const attrs = v.attributes || {};
        const brand = attrs.brand || '';
        const model = attrs.model || '';
        const price = attrs.price || 0;
        const fuel = attrs.fuel_type || 'N/A';
        const ownership = attrs.ownership || 'N/A';
        const image = v.images?.[0] || 'N/A';

        const details = `🚗 *${brand} ${model}*\n💰 Price: ₹ ${Number(price).toLocaleString('en-IN')}\n⛽ Fuel: ${fuel} | 📍 Ownership: ${ownership}\n🔗 View Photo: ${image}\n\nReply BOOK to reserve a test drive!`;

        await this.whatsappService.sendTextMessage(to, details, tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);
        if (!session.context) session.context = {};
        session.context.current_car_id = v._id;
        session.state = 'CAR_DETAIL';
    }

    private async handleBookingName(tenant: any, session: ISessionData, to: string, input: string) {
        if (!session.context) session.context = {};
        session.context.lead_name = input;
        session.state = 'BOOK_DATE';
        await this.whatsappService.sendTextMessage(to, `Thanks ${input}! 🗓️ What date and time would you prefer for the test drive? (e.g. 5th April, 10:00 AM)`, tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);
    }

    private async handleBookingDate(tenant: any, session: ISessionData, to: string, input: string) {
        if (!session.context) session.context = {};

        // Parse natural language date
        const parsedDate = await this.geminiService.parseDateTime(input);

        // ✅ HTTP POST to bot-service internal leads endpoint
        await botServiceClient.post('/internal/leads', {
            tenantId: session.tenantId,
            phone: to,
            name: session.context.lead_name,
            vehicleId: session.context.current_car_id,
            preferredDateTime: parsedDate,
            status: 'new'
        });

        await this.whatsappService.sendTextMessage(
            to,
            `✅ *Test Drive Requested!*\n\nYour booking for *${parsedDate}* is confirmed. Our team will call you at ${to} to finalize the details.\n\nType MENU for more options.`,
            tenant.whatsappConfig.phoneNumberId,
            tenant.whatsappConfig.accessToken
        );

        session.state = 'IDLE';
        session.context = { search_filters: {} };
    }

    private async handleRescheduleDate(tenant: any, session: ISessionData, to: string, input: string) {
        if (!session.context?.rescheduling_id) {
            session.state = 'IDLE';
            return;
        }

        // Parse natural language date
        const parsedDate = await this.geminiService.parseDateTime(input);

        // ✅ HTTP PATCH to bot-service internal leads endpoint
        await botServiceClient.patch(`/internal/leads/${session.context.rescheduling_id}`, {
            preferredDateTime: parsedDate,
            status: 'rescheduled'
        });

        await this.whatsappService.sendTextMessage(
            to,
            `🗓️ *Booking Rescheduled!*\n\nYour test drive has been updated to *${parsedDate}*. We look forward to seeing you!\n\nType MENU for more options.`,
            tenant.whatsappConfig.phoneNumberId,
            tenant.whatsappConfig.accessToken
        );

        session.state = 'IDLE';
        session.context = { search_filters: {} };
    }

    private async sendLatestVehicles(tenant: any, to: string) {
        const res = await inventoryServiceClient.get('/internal/vehicles', {
            params: { tenantId: (tenant.id || tenant._id)?.toString(), status: 'available' }
        });
        const vs = res.data?.data || [];

        if (vs.length === 0) return this.whatsappService.sendTextMessage(to, "No cars available right now. 🙏", tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);

        let r = `🚗 *Available Inventory*\n\n`;
        vs.forEach((v: any) => {
            const attrs = v.attributes || {};
            const brand = attrs.brand || '';
            const model = attrs.model || '';
            const price = attrs.price || 0;
            const code = attrs.car_code || 'N/A';
            r += `• *${brand} ${model}* (₹${Number(price).toLocaleString('en-IN')}) | ID: *${code}*\n`;
        });
        r += `\nSend the Car ID for full details!`;
        await this.whatsappService.sendTextMessage(to, r, tenant.whatsappConfig.phoneNumberId, tenant.whatsappConfig.accessToken);
    }
}
