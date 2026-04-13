import { injectable, inject } from 'tsyringe';
import { IInvoiceRepository } from '../interfaces/IRepository/IInvoiceRepository';
import { ISequenceRepository } from '../interfaces/IRepository/ISequenceRepository';
import { IExpenseRepository } from '../interfaces/IRepository/IExpenseRepository';
import { IBillingService } from '../interfaces/IService/IBillingService';
import { logger } from '../utils/logger';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

@injectable()
export class BillingService implements IBillingService {
    constructor(
        @inject('InvoiceRepository') private invoiceRepository: IInvoiceRepository,
        @inject('SequenceRepository') private sequenceRepository: ISequenceRepository,
        @inject('ExpenseRepository') private expenseRepository: IExpenseRepository
    ) {}
    
    async createInvoice(tenantId: string, data: any) {
        const currentNumber = await this.sequenceRepository.getNextNumber(tenantId, 'invoice');
        const year = new Date().getFullYear();
        const invoiceNumber = `INV-${year}-${currentNumber.toString().padStart(4, '0')}`;

        const amount = data.items.reduce((acc: number, item: any) => acc + item.amount, 0);
        const cgst = amount * 0.09;
        const sgst = amount * 0.09;
        const total = amount + cgst + sgst;

        const invoiceData = {
            ...data,
            tenantId,
            invoiceNumber,
            totalAmount: total,
            taxAmount: cgst + sgst,
            taxDetails: { cgst, sgst, igst: 0 }
        };

        return await this.invoiceRepository.create(invoiceData);
    }

    async generateInvoicePDF(invoice: any, tenant: any): Promise<Buffer> {
        return new Promise((resolve) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            doc.rect(0, 0, 600, 80).fill('#4f46e5');
            doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text(tenant.name.toUpperCase(), 50, 25);
            doc.fontSize(10).font('Helvetica').text('GST COMPLIANT INVOICE', 50, 55);
            doc.fillColor('#ffffff').fontSize(9).text(tenant.address || '', 300, 25, { align: 'right', width: 250 });
            doc.text(`Phone: ${tenant.phone || ''}`, 300, 55, { align: 'right', width: 250 });

            doc.fillColor('#444444').fontSize(10).font('Helvetica-Bold').text('INVOICE TO:', 50, 110);
            doc.font('Helvetica').text(invoice.customerName, 50, 125);
            doc.text(`Date: ${format(new Date(), 'dd MMM yyyy')}`, 50, 140);
            doc.font('Helvetica-Bold').text('INVOICE DETAILS:', 350, 110);
            doc.font('Helvetica').text(`Invoice #: ${invoice.invoiceNumber}`, 350, 125);
            doc.text(`Status: ${invoice.status.toUpperCase()}`, 350, 140);

            const tableTop = 190;
            doc.rect(50, tableTop, 500, 25).fill('#f8fafc');
            doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold');
            doc.text('DESCRIPTION', 60, tableTop + 8);
            doc.text('AMOUNT (INR)', 450, tableTop + 8, { align: 'right', width: 90 });

            let y = tableTop + 35;
            doc.fillColor('#1e293b').font('Helvetica');
            invoice.items.forEach((item: any) => {
                doc.text(item.description, 60, y);
                doc.text(item.amount.toLocaleString('en-IN'), 450, y, { align: 'right', width: 90 });
                y += 25;
                doc.moveTo(50, y - 5).lineTo(550, y - 5).strokeColor('#f1f5f9').stroke();
            });

            y += 20;
            const summaryX = 350;
            doc.fontSize(10).fillColor('#64748b').text('Subtotal:', summaryX, y);
            doc.fillColor('#1e293b').text(`₹${(invoice.totalAmount - invoice.taxAmount).toLocaleString('en-IN')}`, 450, y, { align: 'right', width: 90 });
            y += 20;
            doc.fillColor('#64748b').text('GST (18%):', summaryX, y);
            doc.fillColor('#1e293b').text(`₹${invoice.taxAmount.toLocaleString('en-IN')}`, 450, y, { align: 'right', width: 90 });
            y += 30;
            doc.rect(summaryX - 10, y - 10, 210, 40).fill('#4f46e5');
            doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text('Total Amount:', summaryX, y + 2);
            doc.text(`₹${invoice.totalAmount.toLocaleString('en-IN')}`, 450, y + 2, { align: 'right', width: 90 });

            doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text('This is a computer generated document. No signature is required.', 50, 750, { align: 'center', width: 500 });
            doc.end();
        });
    }

    async generateDeliveryNotePDF(data: any, tenant: any): Promise<Buffer> {
        return new Promise((resolve) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            doc.rect(0, 0, 600, 80).fill('#0f172a');
            doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('DELIVERY NOTE', 50, 25);
            doc.fontSize(10).font('Helvetica').text(tenant.name.toUpperCase(), 50, 55);

            doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('VEHICLE DELIVERY DETAILS', 50, 110);
            doc.rect(50, 130, 500, 180).strokeColor('#e2e8f0').stroke();

            const gridY = 150;
            const leftCol = 70;
            const rightCol = 300;
            doc.fontSize(10).fillColor('#64748b');
            doc.text('Customer Name:', leftCol, gridY);
            doc.fillColor('#1e293b').text(data.customerName, leftCol + 100, gridY);
            doc.fillColor('#64748b').text('Vehicle Brand:', rightCol, gridY);
            doc.fillColor('#1e293b').text(data.brand, rightCol + 100, gridY);
            doc.fillColor('#64748b').text('Deliver Date:', leftCol, gridY + 30);
            doc.fillColor('#1e293b').text(format(new Date(), 'dd MMM yyyy'), leftCol + 100, gridY + 30);
            doc.fillColor('#64748b').text('Model / Year:', rightCol, gridY + 30);
            doc.fillColor('#1e293b').text(`${data.model} / ${data.year}`, rightCol + 100, gridY + 30);
            doc.fillColor('#64748b').text('Chassis No:', leftCol, gridY + 60);
            doc.fillColor('#1e293b').text(data.chassisNo || 'N/A', leftCol + 100, gridY + 60);
            doc.fillColor('#64748b').text('Color:', rightCol, gridY + 60);
            doc.fillColor('#1e293b').text(data.color || 'N/A', rightCol + 100, gridY + 60);

            doc.fontSize(10).fillColor('#1e293b').text('I hereby acknowledge that I have received the above mentioned vehicle in good condition along with all necessary documents and keys.', 50, 350, { width: 500, lineGap: 5 });

            const sigY = 500;
            doc.moveTo(50, sigY).lineTo(200, sigY).strokeColor('#cbd5e1').stroke();
            doc.moveTo(350, sigY).lineTo(500, sigY).stroke();
            doc.fontSize(8).fillColor('#64748b');
            doc.text('Customer Signature', 50, sigY + 10, { width: 150, align: 'center' });
            doc.text('Authorized Signatory', 350, sigY + 10, { width: 150, align: 'center' });

            if (data.signatureData) {
                try {
                    const base64Data = data.signatureData.replace(/^data:image\/png;base64,/, "");
                    doc.image(Buffer.from(base64Data, 'base64'), 50, sigY - 60, { width: 120 });
                } catch (e) {
                    logger.error('Failed to embed signature in PDF');
                }
            }
            doc.end();
        });
    }

    async trackExpense(tenantId: string, data: any) {
        return await this.expenseRepository.create({ ...data, tenantId });
    }
}


