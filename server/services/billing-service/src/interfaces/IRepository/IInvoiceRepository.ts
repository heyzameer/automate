import { IInvoice } from '../../models/Invoice';
import { IBaseRepository } from '@carbot/common';

export interface IInvoiceRepository extends IBaseRepository<IInvoice> {
    findByTenant(tenantId: string): Promise<IInvoice[]>;
    findByInvoiceNumber(tenantId: string, invoiceNumber: string): Promise<IInvoice | null>;
}
