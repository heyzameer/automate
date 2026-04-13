export interface IBillingService {
    createInvoice(tenantId: string, data: any): Promise<any>;
    generateInvoicePDF(invoice: any, tenant: any): Promise<Buffer>;
    generateDeliveryNotePDF(data: any, tenant: any): Promise<Buffer>;
    trackExpense(tenantId: string, data: any): Promise<any>;
}
