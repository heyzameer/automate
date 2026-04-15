import mongoose, { Schema, Document } from 'mongoose';

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export interface IInvoice extends Document {
  tenantId: string;
  invoiceNumber: string;
  vehicleId: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  taxAmount: number;
  taxDetails: {
    cgst: number;
    sgst: number;
    igst: number;
  };
  status: InvoiceStatus;
  items: Array<{
    description: string;
    amount: number;
  }>;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  invoiceNumber: { type: String, required: true },
  vehicleId: { type: String, required: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  taxDetails: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
  },
  status: {
    type: String,
    enum: Object.values(InvoiceStatus),
    default: InvoiceStatus.DRAFT
  },
  items: [{
    description: { type: String, required: true },
    amount: { type: Number, required: true },
  }],
  pdfUrl: { type: String },
}, { 
  timestamps: true,
  collection: 'invoices'
});

InvoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });

export const InvoiceModel = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
