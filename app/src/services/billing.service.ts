import api from '../lib/api';
import { API_ENDPOINTS } from '../constants/endpoints';

export const billingService = {
    createInvoice: async (data: any) => {
        const { data: res } = await api.post('/billing/invoices', data);
        return res.data;
    },

    downloadInvoice: async (invoiceId: string, invoiceNumber: string) => {
        const response = await api.get(`/billing/invoices/${invoiceId}/pdf`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    downloadDeliveryNote: async (data: any) => {
        const response = await api.post('/billing/delivery-note', data, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'delivery-note.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
