import { Router } from 'express';
import { container } from 'tsyringe';
import { BillingController } from '../controllers/BillingController';

const router = Router();
const controller = container.resolve(BillingController);

router.post('/invoices', controller.createInvoice.bind(controller));
router.get('/invoices/:id/pdf', controller.getInvoicePDF.bind(controller));
router.post('/delivery-note', controller.generateDeliveryNote.bind(controller));
router.post('/expenses', controller.trackExpense.bind(controller));

export default router;
