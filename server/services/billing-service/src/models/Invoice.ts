import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  tenantId: string;
  invoiceNumber: string;
  vehicleId: string;
  customerId: string; // From Lead/CRM
  customerName: string;
  totalAmount: number;
  taxAmount: number;
  taxDetails: {
    cgst: number;
    sgst: number;
    igst: number;
  };
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  items: Array<{
    description: string;
    amount: number;
  }>;
  pdfUrl?: string;
  createdAt: Date;
}

const invoiceSchema = new Schema<IInvoice>({
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
    igst: { type: Number, default: 0 }
  },
  status: { type: String, enum: ['draft', 'issued', 'paid', 'cancelled'], default: 'draft' },
  items: [{
    description: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  pdfUrl: { type: String }
}, {
  timestamps: true
});

// Compound index for unique invoice numbers per tenant
invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
