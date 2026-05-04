import { injectable } from 'tsyringe';
import { Campaign } from '../models/Campaign';
import { logger } from '../utils/logger';

// Native date helpers replacing date-fns (not bundled in production)
const addDays = (date: Date, days: number): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};
const isSameDay = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const FESTIVALS = [
    { name: 'Diwali', date: '11-01', template: 'Happy Diwali to you and your family! 🪔 May this year bring you closer to your dream car. Checkout our festive offers at {showroom_name}!' },
    { name: 'Eid al-Fitr', date: '03-31', template: 'Eid Mubarak! 🌙 Wishing you a wonderful celebration and joy. Celebrate with a new set of wheels from {showroom_name}!' },
    { name: 'Christmas', date: '12-25', template: 'Merry Christmas! 🎄 Holiday season is here. We have special holiday discounts for our loyal customers at {showroom_name}!' },
    { name: 'New Year', date: '01-01', template: 'Happy New Year! 🎆 Start 2026 with a fresh start and a fresh car. Visit us at {showroom_name} today.' }
];

@injectable()
export class FestivalService {
    
    async checkAndCreateDrafts() {
        try {
            const today = new Date();
            const threeDaysFromNow = addDays(today, 3);
            
            for (const festival of FESTIVALS) {
                const [m, d] = festival.date.split('-').map(Number);
                const festivalDate = new Date(today.getFullYear(), m - 1, d);
                
                if (isSameDay(festivalDate, threeDaysFromNow)) {
                    logger.info(`Upcoming festival detected: ${festival.name}. Creating drafts...`);
                    await this.createAutoDrafts(festival);
                }
            }
        } catch (error) {
            logger.error('Error checking festivals:', error);
        }
    }

    private async createAutoDrafts(festival: any) {
        // Fetch all active tenants/showrooms
        // For now, we'll create drafts for existing campaigns' tenants to demonstrate
        const tenants = await Campaign.distinct('tenantId');
        
        for (const tenantId of tenants) {
            const exists = await Campaign.findOne({
                tenantId,
                name: `Auto: ${festival.name} Campaign`,
                status: 'draft'
            });

            if (!exists) {
                await Campaign.create({
                    tenantId,
                    name: `Auto: ${festival.name} Campaign`,
                    type: 'whatsapp',
                    audience: 'all',
                    message: festival.template,
                    status: 'draft'
                });
                logger.info(`Created auto-draft ${festival.name} for tenant ${tenantId}`);
            }
        }
    }
}
