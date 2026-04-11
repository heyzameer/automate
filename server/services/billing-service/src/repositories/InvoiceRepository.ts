import { injectable } from 'tsyringe';
import { BaseRepository } from '@carbot/common';
import { Invoice, IInvoice } from '../models/Invoice';

@injectable()
export class InvoiceRepository extends BaseRepository<IInvoice> {
  constructor() {
    super(Invoice);
  }

  async findByTenant(tenantId: string): Promise<IInvoice[]> {
    return this.find({ tenantId });
  }

  async findByInvoiceNumber(tenantId: string, invoiceNumber: string): Promise<IInvoice | null> {
    return this.findOne({ tenantId, invoiceNumber });
  }
}
