import cron from 'node-cron';
import { injectable, container } from 'tsyringe';
import Vehicle from '../models/Vehicle';
import { logger } from '../utils/logger';

@injectable()
export class AlertService {
    constructor() {}

    /**
     * Initializes cron jobs for alerts
     * Runs every day at midnight (00:00)
     */
    public initialize(): void {
        // Daily check at midnight
        cron.schedule('0 0 * * *', () => {
            this.checkExpiries();
        });
        
        logger.info('Alert Service initialized: Daily expiry checks scheduled.');
    }

    /**
     * Checks for insurance and RC expiries
     */
    public async checkExpiries(): Promise<void> {
        try {
            logger.info('Running daily expiry checks...');
            
            const today = new Date();
            const in30Days = new Date();
            in30Days.setDate(today.getDate() + 30);
            
            const in7Days = new Date();
            in7Days.setDate(today.getDate() + 7);

            // 1. Check for Insurance Expiry in 30 days and 7 days
            await this.checkExpiriesByType('insuranceExpiry', in30Days, '30-day');
            await this.checkExpiriesByType('insuranceExpiry', in7Days, '7-day');

            // 2. Check for RC Expiry in 30 days and 7 days
            await this.checkExpiriesByType('rcExpiry', in30Days, '30-day');
            await this.checkExpiriesByType('rcExpiry', in7Days, '7-day');
            
            logger.info('Daily expiry checks completed.');
        } catch (error: any) {
            logger.error('Error during expiry checks:', error.message);
        }
    }

    private async checkExpiriesByType(fieldName: string, targetDate: Date, label: string): Promise<void> {
        // Start and end of the target day
        const start = new Date(targetDate.setHours(0, 0, 0, 0));
        const end = new Date(targetDate.setHours(23, 59, 59, 999));

        const vehicles = await Vehicle.find({
            [fieldName]: { $gte: start, $lte: end },
            status: { $ne: 'sold' }
        });

        if (vehicles.length > 0) {
            const type = fieldName === 'insuranceExpiry' ? 'INSURANCE_EXPIRY' : 'RC_EXPIRY';
            logger.info(`Found ${vehicles.length} vehicles with ${type} in ${label}.`);
            
            for (const vehicle of vehicles) {
                this.triggerNotification(vehicle, type, label, (vehicle as any)[fieldName]);
            }
        }
    }

    private async triggerNotification(vehicle: any, type: string, timeframe: string, date: Date): Promise<void> {
        const message = `${vehicle.attributes.get('brand')} ${vehicle.attributes.get('model')} (${vehicle.attributes.get('car_code')}) - ${type.replace('_', ' ')} in ${timeframe}.`;
        
        logger.warn(`[ALERT_DISPATCH] ${message}`);
        
        try {
            // Call Notification Service API
            const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5003';
            const event = type === 'INSURANCE_EXPIRY' ? 'insurance.expiring' : 'rc.expiring';
            
            await require('axios').post(`${notificationUrl}/api/v1/notifications/dispatch`, {
                event: event,
                payload: {
                    tenantId: vehicle.tenantId,
                    idempotencyKey: `alert-${vehicle._id}-${type}-${timeframe}-${new Date().toISOString().split('T')[0]}`,
                    data: {
                        vehicleId: vehicle._id,
                        carName: `${vehicle.attributes.get('brand')} ${vehicle.attributes.get('model')}`,
                        days: timeframe.split('-')[0],
                        date: date.toISOString(),
                        type: type
                    }
                }
            }, {
                headers: { 'x-internal-secret': 'carbot-internal-super-secret' }
            });
        } catch (err: any) {
            logger.error(`Failed to dispatch notification: ${err.message}`);
        }
    }
}
