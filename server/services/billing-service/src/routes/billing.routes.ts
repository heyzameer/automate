import { Router } from 'express';
import { container } from 'tsyringe';
import { BillingController } from '../controllers/BillingController';

const router = Router();

router.post('/invoices', (req, res) => container.resolve(BillingController).createInvoice(req as any, res));
router.get('/invoices/:id/pdf', (req, res) => container.resolve(BillingController).getInvoicePDF(req as any, res));
router.post('/delivery-note', (req, res) => container.resolve(BillingController).generateDeliveryNote(req as any, res));
router.post('/expenses', (req, res) => container.resolve(BillingController).trackExpense(req as any, res));

export default router;
