import { injectable } from 'tsyringe';
import { BaseRepository } from '@carbot/common';
import { Invoice, IInvoice } from '../models/Invoice';
import { IInvoiceRepository } from '../interfaces/IRepository/IInvoiceRepository';

@injectable()
export class InvoiceRepository extends BaseRepository<IInvoice> implements IInvoiceRepository {
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

