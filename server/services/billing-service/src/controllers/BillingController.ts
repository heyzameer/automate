import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { injectable, inject } from 'tsyringe';
import { IBillingService } from '../interfaces/IService/IBillingService';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import axios from 'axios';
import config from '../config';
import { Invoice } from '../models/Invoice';

@injectable()
export class BillingController {
    constructor(
        @inject('BillingService') private billingService: IBillingService
    ) { }

    async createInvoice(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = req.user?.tenantId || (req.headers['x-tenant-id'] as string);
            const invoice = await this.billingService.createInvoice(tenantId, req.body);
            return sendSuccess(res, 'Invoice created successfully', { invoice });
        } catch (error: any) {
            logger.error('Error creating invoice:', error.message);
            return sendError(res, error.message);
        }
    }

    async getInvoicePDF(req: AuthenticatedRequest, res: Response) {
        try {
            const invoice = await Invoice.findById(req.params.id);
            if (!invoice) return sendError(res, 'Invoice not found', 404);

            const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
            const tenantRes = await axios.get(`${authUrl}/api/v1/auth/internal/tenants/${invoice.tenantId}`, {
                headers: { 'x-internal-secret': config.internalSecret }
            });
            const tenant = tenantRes.data?.data || { name: 'CarBot AI Showroom' };

            const pdfBuffer = await this.billingService.generateInvoicePDF(invoice, tenant);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
            res.send(pdfBuffer);
        } catch (error: any) {
            logger.error('Error generating PDF:', error.message);
            return sendError(res, 'Failed to generate invoice PDF');
        }
    }

    async generateDeliveryNote(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = req.user?.tenantId || (req.headers['x-tenant-id'] as string);

            const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
            const tenantRes = await axios.get(`${authUrl}/api/v1/auth/internal/tenants/${tenantId}`, {
                headers: { 'x-internal-secret': config.internalSecret }
            });
            const tenant = tenantRes.data?.data || { name: 'CarBot AI Showroom' };

            const pdfBuffer = await this.billingService.generateDeliveryNotePDF(req.body, tenant);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=delivery-note.pdf`);
            res.send(pdfBuffer);
        } catch (error: any) {
            logger.error('Error generating Delivery Note:', error.message);
            return sendError(res, 'Failed to generate delivery note');
        }
    }

    async trackExpense(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = req.user?.tenantId || (req.headers['x-tenant-id'] as string);
            const expense = await this.billingService.trackExpense(tenantId, req.body);
            return sendSuccess(res, 'Expense tracked', { expense });
        } catch (error: any) {
            logger.error('Error tracking expense:', error.message);
            return sendError(res, error.message);
        }
    }
}

