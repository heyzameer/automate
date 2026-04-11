import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { BillingService } from '../services/BillingService';
import { logger } from '../utils/logger';

@injectable()
export class BillingController {
    constructor(private billingService: BillingService) {}

    async createInvoice(req: Request, res: Response) {
        try {
            const tenantId = req.headers['x-tenant-id'] as string;
            const invoice = await this.billingService.createInvoice(tenantId, req.body);
            res.json({ success: true, data: invoice });
        } catch (error: any) {
            logger.error('Error creating invoice:', error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async getInvoicePDF(req: Request, res: Response) {
        try {
            const { Invoice } = require('../models/Invoice');
            const axios = require('axios');
            const invoice = await Invoice.findById(req.params.id);
            
            if (!invoice) {
                return res.status(404).json({ success: false, message: 'Invoice not found' });
            }

            // Fetch tenant info for branding
            const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
            const tenantRes = await axios.get(`${authUrl}/api/v1/auth/internal/tenants/${invoice.tenantId}`, {
                headers: { 'x-internal-secret': 'carbot-internal-super-secret' }
            });
            const tenant = tenantRes.data?.data || { name: 'CarBot AI Showroom' };

            const pdfBuffer = await this.billingService.generateInvoicePDF(invoice, tenant);
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
            res.send(pdfBuffer);
        } catch (error: any) {
            logger.error('Error generating PDF:', error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async generateDeliveryNote(req: Request, res: Response) {
        try {
            const tenantId = req.headers['x-tenant-id'] as string;
            const axios = require('axios');
            
            // Fetch tenant info for branding
            const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
            const tenantRes = await axios.get(`${authUrl}/api/v1/auth/internal/tenants/${tenantId}`, {
                headers: { 'x-internal-secret': 'carbot-internal-super-secret' }
            });
            const tenant = tenantRes.data?.data || { name: 'CarBot AI Showroom' };

            const pdfBuffer = await this.billingService.generateDeliveryNotePDF(req.body, tenant);
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=delivery-note.pdf`);
            res.send(pdfBuffer);
        } catch (error: any) {
            logger.error('Error generating Delivery Note:', error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async trackExpense(req: Request, res: Response) {
        try {
            const tenantId = req.headers['x-tenant-id'] as string;
            const expense = await this.billingService.trackExpense(tenantId, req.body);
            res.json({ success: true, data: expense });
        } catch (error: any) {
            logger.error('Error tracking expense:', error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
