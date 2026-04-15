import { injectable } from 'tsyringe';
import { MongoBaseRepository } from './MongoBaseRepository';
import { InvoiceModel, IInvoice } from '../models/Invoice.model';
import { IInvoiceRepository } from '../interfaces/IRepository/IInvoiceRepository';

@injectable()
export class InvoiceRepository extends MongoBaseRepository<IInvoice> implements IInvoiceRepository {
  constructor() {
    super(InvoiceModel);
  }

  async findByTenant(tenantId: string): Promise<IInvoice[]> {
    return this.find({ tenantId });
  }

  async findByInvoiceNumber(tenantId: string, invoiceNumber: string): Promise<IInvoice | null> {
    return this.findOne({ tenantId, invoiceNumber });
  }
}
