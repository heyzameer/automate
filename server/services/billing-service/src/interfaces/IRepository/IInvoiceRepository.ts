import { IInvoice } from '../../models/Invoice.model';
import { IMongoBaseRepository } from '../../repositories/MongoBaseRepository';

export interface IInvoiceRepository extends IMongoBaseRepository<IInvoice> {
    findByTenant(tenantId: string): Promise<IInvoice[]>;
    findByInvoiceNumber(tenantId: string, invoiceNumber: string): Promise<IInvoice | null>;
}
