import { Request, Response } from 'express';
import { Booking } from '../models/Booking';
import { sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';
import { getRabbitMQ } from '../utils/rabbitmq';

export class BookingController {
    /**
     * POST /bookings
     * Create a vehicle booking
     */
    async createBooking(req: Request, res: Response) {
        try {
            const { vehicleId, tenantId, bookingDate, notes } = req.body;
            const customerId = (req as any).user?.userId;

            if (!vehicleId || !tenantId || !bookingDate) {
                return res.status(400).json({ success: false, message: 'VehicleId, TenantId and BookingDate are required' });
            }

            const booking = await Booking.create({
                customerId,
                vehicleId,
                tenantId,
                bookingDate,
                notes,
                status: 'pending'
            });

            // Notify showroom via RabbitMQ
            const mq = await getRabbitMQ();
            await mq.publish('carbot_events', 'notification.kiosk_booking', {
                bookingId: booking._id,
                tenantId,
                customerId,
                vehicleId
            });

            return sendSuccess(res, 'Booking request submitted', booking);
        } catch (error: any) {
            logger.error('Error creating booking:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * GET /bookings
     * Get customer bookings
     */
    async getMyBookings(req: Request, res: Response) {
        try {
            const customerId = (req as any).user?.userId;
            const tenantId = req.headers['x-tenant-id'] as string;

            const bookings = await Booking.find({ customerId, tenantId }).populate('vehicleId');
            return sendSuccess(res, 'Bookings fetched', bookings);
        } catch (error: any) {
            logger.error('Error fetching bookings:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}
