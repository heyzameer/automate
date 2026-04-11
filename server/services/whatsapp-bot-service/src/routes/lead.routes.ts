import { Router } from 'express';
import { container } from 'tsyringe';
import { LeadController } from '../controllers/LeadController';

const router = Router();
const leadController = container.resolve(LeadController);

router.get('/', leadController.getLeads.bind(leadController));
router.patch('/:id', leadController.updateLead.bind(leadController));
router.post('/:id/call-log', leadController.addCallLog.bind(leadController));
router.get('/vehicle/:vehicleId', leadController.getLeadsByVehicle.bind(leadController));
router.get('/qr/:carCode', leadController.getQRCode.bind(leadController));

export default router;
