import { Router } from 'express';
import { container } from 'tsyringe';
import { LeadController } from '../controllers/LeadController';

const router = Router();
const leadController = container.resolve(LeadController);

router.get('/', leadController.getLeads.bind(leadController));
router.patch('/:id/status', leadController.updateStatus.bind(leadController));
router.patch('/:id/reschedule', leadController.reschedule.bind(leadController));

export default router;
