import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { injectable, inject } from 'tsyringe';
import { IBillingService } from '../interfaces/IService/IBillingService';
import { IInvoiceRepository } from '../interfaces/IRepository/IInvoiceRepository';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import axios from 'axios';
import config from '../config';

@injectable()
export class BillingController {
    constructor(
        @inject('BillingService') private billingService: IBillingService,
        @inject('InvoiceRepository') private invoiceRepository: IInvoiceRepository
    ) { }

    async createInvoice(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return sendError(res, 'Tenant ID required', 403);
            
            const invoice = await this.billingService.createInvoice(tenantId, req.body);
            return sendSuccess(res, 'Invoice created successfully', { invoice });
        } catch (error: any) {
            logger.error('Error creating invoice:', error.message);
            return sendError(res, error.message);
        }
    }

    async getInvoicePDF(req: AuthenticatedRequest, res: Response) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) return sendError(res, 'Tenant ID required', 403);

            const invoice = await this.invoiceRepository.findOne({ _id: req.params.id as any, tenantId });
            if (!invoice) return sendError(res, 'Invoice not found', 404);

            const tenantRes = await axios.get(`${config.authServiceUrl}/api/v1/auth/internal/tenants/${invoice.tenantId}`, {
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
            const tenantId = req.user?.tenantId;
            if (!tenantId) return sendError(res, 'Tenant ID required', 403);

            const tenantRes = await axios.get(`${config.authServiceUrl}/api/v1/auth/internal/tenants/${tenantId}`, {
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
            const tenantId = req.user?.tenantId;
            if (!tenantId) return sendError(res, 'Tenant ID required', 403);
            
            const expense = await this.billingService.trackExpense(tenantId, req.body);
            return sendSuccess(res, 'Expense tracked', { expense });
        } catch (error: any) {
            logger.error('Error tracking expense:', error.message);
            return sendError(res, error.message);
        }
    }
}

