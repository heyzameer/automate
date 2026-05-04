import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { sendSuccess, sendError } from '../utils/response';
import { Customer } from '../models/Customer';
import { CustomerOTP } from '../models/CustomerOTP';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UserRole } from '../types';
import { getRabbitMQ } from '../utils/rabbitmq';

export class CustomerAuthController {
    /**
     * POST /customer/auth/request-otp
     * Request a login OTP for a showroom kiosk.
     */
    requestOTP = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.body.tenantId || req.headers['x-tenant-id'];
        const { email, fullName, phone } = req.body;

        if (!email || !tenantId || !phone) {
            return res.status(400).json({ success: false, message: 'Email, TenantId, and Phone Number are required' });
        }

        // 1. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // 2. Save OTP
        await CustomerOTP.findOneAndUpdate(
            { email },
            { otp, expiresAt },
            { upsert: true, new: true }
        );

        // 3. Ensure Customer exists or create (Lazy Register)
        let customer = await Customer.findOne({ email, tenantId });
        if (!customer && fullName && phone) {
            customer = await Customer.create({ email, tenantId, fullName, phone });
        }

        // 4. Publish event for Notification Service to send Email
        const mq = await getRabbitMQ();
        await mq.publish('carbot_events', 'notification.customer_otp', {
            email,
            otp,
            tenantId,
            showroomName: (await import('../models/Tenant').then(m => m.Tenant.findById(tenantId)))?.name || 'Showroom'
        });

        logger.info(`OTP requested for customer ${email} at tenant ${tenantId}`);
        sendSuccess(res, 'OTP sent to your email');
    });

    /**
     * POST /customer/auth/verify-otp
     * Verify OTP and issue JWT.
     */
    verifyOTP = asyncHandler(async (req: Request, res: Response) => {
        const tenantId = req.body.tenantId || req.headers['x-tenant-id'];
        const { email, otp } = req.body;

        if (!email || !otp || !tenantId) {
            return res.status(400).json({ success: false, message: 'Email, OTP and TenantId are required' });
        }

        // 1. Check OTP
        const otpDoc = await CustomerOTP.findOne({ email, otp });
        if (!otpDoc || otpDoc.expiresAt < new Date()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // 2. Get Customer
        const customer = await Customer.findOne({ email, tenantId });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found. Please provide details first.' });
        }

        // 3. Mark as verified
        customer.isVerified = true;
        await customer.save();

        // 4. Delete used OTP
        await CustomerOTP.deleteOne({ _id: otpDoc._id });

        // 5. Generate JWT
        const token = jwt.sign(
            { 
                userId: customer._id, 
                email: customer.email, 
                role: UserRole.CUSTOMER, 
                tenantId 
            },
            config.jwtSecret,
            { expiresIn: '7d' }
        );

        sendSuccess(res, 'Login successful', {
            token,
            customer: {
                id: customer._id,
                email: customer.email,
                fullName: customer.fullName,
                phone: customer.phone
            }
        });
    });

    /**
     * GET /customer/profile
     * Protected route to get customer info.
     */
    getProfile = asyncHandler(async (req: Request, res: Response) => {
        const customerId = (req as any).user?.userId;
        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
        sendSuccess(res, 'Profile retrieved', customer);
    });
}
